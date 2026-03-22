import { aiProvider } from '../ai/openai';
import { getSystemPrompt } from './promptEngine';
import { estimatesRepo } from '../repositories/estimates';
import { RuleEngine } from './ruleEngine';
import { EstimateReviewReportSchema } from './schemas';
import { z } from 'zod';

export async function processEstimateReview(
    projectId: string,
    sourceFileId: string,
    parsedDataLines: string[]
) {
    // 1 & 2. Parse input & normalize data
    // (Assuming passed as `parsedDataLines` which are normalized array of text lines/CSV rows)

    // 3. Apply deterministic rules
    const ruleViolations = RuleEngine.evaluate(parsedDataLines);

    // 4. Run LLM reasoning ONLY on bounded data
    const systemPrompt = getSystemPrompt();

    const userPrompt = `
Task: Review an estimate.
Data (Line items):
${parsedDataLines.map((l, i) => `[${i + 1}] ${l}`).join('\n')}

Rule Engine Warnings (Must include in findings):
${ruleViolations.map(v => `- Rule: ${v.ruleId} (Trigger: ${v.triggeredBy})
  Missing items to check: ${v.missingItems.join(', ')}
  Note: ${v.note}`).join('\n')}

Instructions:
Identify vague items, duplicates, and process the Rule Engine warnings.
Return structured findings. Assign confidence. If data is insufficient, use missing_data.
  `;

    const response = await aiProvider.generateStructured<z.infer<typeof EstimateReviewReportSchema>>(
        systemPrompt,
        userPrompt,
        {
            type: "object",
            properties: {
                findings: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            section: { type: "string" },
                            item_name: { type: "string" },
                            status: { type: "string", enum: ["found", "missing", "unclear", "duplicate", "needs_review", "insufficient_data"] },
                            confidence: { type: "string", enum: ["high", "medium", "low"] },
                            basis: { type: "string" },
                            comment: { type: "string" },
                            recommended_action: { type: "string" }
                        },
                        required: ["section", "item_name", "status", "confidence", "basis"]
                    }
                },
                missing_data: { type: "array", items: { type: "string" } },
                needs_confirmation: { type: "boolean" }
            },
            required: ["findings", "needs_confirmation"]
        },
        "EstimateReviewReport",
        "Detailed estimate review with findings"
    );

    // 5. Validate output against schema
    const validatedData = EstimateReviewReportSchema.parse(response.data);

    // Pre-calculate minimum confidence for root level
    const minConfidence = validatedData.findings.some(f => f.confidence === 'low') ? 'low' :
        validatedData.findings.some(f => f.confidence === 'medium') ? 'medium' : 'high';

    // 6. Persist results
    const savedReview = estimatesRepo.create({
        project_id: projectId,
        source_file_id: sourceFileId,
        findings_json: JSON.stringify(validatedData),
        confidence: minConfidence,
        source_refs: JSON.stringify(['parsed_csv_lines', 'rule_engine']),
        missing_data: validatedData.missing_data ? JSON.stringify(validatedData.missing_data) : null,
        needs_confirmation: validatedData.needs_confirmation
    });

    return savedReview;
}
