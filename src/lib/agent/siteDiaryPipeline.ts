import { aiProvider } from '../ai/openai';
import { getSystemPrompt } from './promptEngine';
import { diaryRepo } from '../repositories/diary';
import { issuesRepo } from '../repositories/issues';
import { rulesRepo } from '../repositories/rulesRepo';
import { projectEstimatesRepo } from '../repositories/projectEstimatesRepo';
import { projectScheduleRepo } from '../repositories/projectScheduleRepo';
import { performVisualAudit } from './visualAuditPipeline';
import { SiteDiarySchema } from './schemas';
import { z } from 'zod';
import translations from './translations.json';

export async function processSiteDiary(
    projectId: string,
    date: string,
    rawText: string,
    photos: { mimeType: string, data: string }[] = []
) {
    const systemPrompt = getSystemPrompt();
    const terminologyMapping = JSON.stringify(translations, null, 2);

    // Inject schedule context for LLM predictions
    const scheduleItems = projectScheduleRepo.findByProjectId(projectId);
    const scheduleStr = JSON.stringify(scheduleItems, null, 2);

    const userPrompt = `
Task: Create a structured Site Diary (Stavební deník) entry.
Source text may be in Czech, Russian, Ukrainian, or English.
CRITICAL: You MUST translate all extracted data into ENGLISH. Ensure BOQ terms (item_name) strictly match the standard English terms defined below.

Terminology Mapping (Dictionaries):
${terminologyMapping}

Project Schedule (Gantt) context for forecasting:
${scheduleStr}

Date: ${date}

Raw Notes/Transcript:
${rawText}

Instructions:
Extract facts, group into sections, identify issues and follow-up actions.
If specific quantities and works are mentioned, extract them into quantities_reported.
If data is missing for a standard diary (e.g., weather, participants), leave them empty or note them.
Assess confidence based on the level of detail provided.
Evaluate the current pace of work against the provided Project Schedule. If work is moving slower or faster than the planned end_dates, estimate a new overall 'predicted_completion_date' for the project in YYYY-MM-DD format. If on track, use the latest end_date from the schedule.
  `;

    // 1. Run LLM parsing
    const response = await aiProvider.generateStructured<z.infer<typeof SiteDiarySchema>>(
        systemPrompt,
        userPrompt,
        {
            type: "object",
            properties: {
                project_name: { type: "string" },
                date: { type: "string" },
                author: { type: "string" },
                summary: { type: "string" },
                weather: { type: "string" },
                participants: { type: "array", items: { type: "string" } },
                sections: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { title: { type: "string" }, content: { type: "string" } },
                        required: ["title", "content"]
                    }
                },
                open_issues: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { description: { type: "string" }, status: { type: "string", enum: ["open", "in_progress", "resolved"] } },
                        required: ["description", "status"]
                    }
                },
                follow_up_actions: { type: "array", items: { type: "string" } },
                financial_impacts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { item_name: { type: "string" }, consumed_pct: { type: "number" }, remaining_pct: { type: "number" }, is_overrun: { type: "boolean" } }
                    }
                },
                quantities_reported: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { item_name: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" } },
                        required: ["item_name", "quantity", "unit"]
                    }
                },
                predicted_completion_date: { type: "string" },
                photo_captions: { type: "array", items: { type: "string" } },
                draft_status: { type: "string", enum: ["draft_for_review"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["project_name", "date", "summary", "sections", "draft_status", "confidence"]
        },
        "SiteDiary",
        "Structured site diary entry"
    );

    // 2. Validate with Zod
    const validatedData = SiteDiarySchema.parse(response.data);

    // 3. Automated Tech Supervision (Apply Rule Engine)
    const techRules = rulesRepo.getTechRules();
    const violations: any[] = [];
    const textToSearch = (validatedData.summary + " " + JSON.stringify(validatedData.sections)).toLowerCase();

    for (const rule of techRules) {
        if (textToSearch.includes(rule.process_keyword.toLowerCase())) {
            // Check required fields
            rule.required_fields.forEach(field => {
                if (field === 'weather_conditions' && (!validatedData.weather || validatedData.weather.toLowerCase() === 'unknown')) {
                    violations.push({
                        rule_id: rule.process_keyword,
                        type: 'missing_field',
                        description: `Missing required field for ${rule.process_keyword}: weather_conditions`,
                        severity: 'violation'
                    });
                }
                if (field === 'photos' && !rawText.toLowerCase().includes('photo') && photos.length === 0 && !rawText.toLowerCase().includes('img')) {
                    violations.push({
                        rule_id: rule.process_keyword,
                        type: 'missing_field',
                        description: `Missing required documentation for ${rule.process_keyword}: photos`,
                        severity: 'flagged'
                    });
                }
            });

            // Check overspending (Mock: if keyword followed by number > 100)
            const qtyMatch = textToSearch.match(new RegExp(`${rule.process_keyword}[^0-9]*(\\d+)`));
            if (qtyMatch && rule.max_overspend_pct) {
                const qty = parseInt(qtyMatch[1], 10);
                const mockEstimateQty = 100; // Mocked for MVP
                if (qty > mockEstimateQty * (1 + rule.max_overspend_pct / 100)) {
                    violations.push({
                        rule_id: 'overspending',
                        type: 'overspending',
                        description: `Potential Overspending: Reported ${qty} unit(s) for ${rule.process_keyword}, exceeds norm by >${rule.max_overspend_pct}%.`,
                        severity: 'flagged'
                    });
                }
            }
        }
    }

    // 3.5 Budget Control & BOQ Matching
    if (validatedData.quantities_reported && validatedData.quantities_reported.length > 0) {
        validatedData.financial_impacts = [];
        for (const reported of validatedData.quantities_reported) {
            const estimateItem = projectEstimatesRepo.findByItemName(projectId, reported.item_name);
            if (estimateItem) {
                const totalAfter = estimateItem.used_quantity + reported.quantity;
                const limit = estimateItem.planned_quantity * 1.05;
                const isOverrun = totalAfter > limit;

                if (isOverrun) {
                    violations.push({
                        rule_id: 'budget_overrun',
                        type: 'budget_overrun',
                        description: `Budget Overrun: Reported ${reported.quantity} ${reported.unit} for '${reported.item_name}'. Total used (${totalAfter}) exceeds planned (${estimateItem.planned_quantity}) by >5%.`,
                        severity: 'violation'
                    });
                }
                // Update the estimate repository immediately
                projectEstimatesRepo.addUsedQuantity(estimateItem.id, reported.quantity);

                const consumedPct = (reported.quantity / estimateItem.planned_quantity) * 100;
                const remainingPct = Math.max(0, ((estimateItem.planned_quantity - totalAfter) / estimateItem.planned_quantity) * 100);

                validatedData.financial_impacts.push({
                    item_name: estimateItem.item_name,
                    consumed_pct: consumedPct,
                    remaining_pct: remainingPct,
                    is_overrun: isOverrun
                });
            } else {
                violations.push({
                    rule_id: 'item_not_in_estimate',
                    type: 'warning',
                    description: `Unbudgeted Work: Reported work for '${reported.item_name}' (${reported.quantity} ${reported.unit}) is not found in the official estimate BOQ.`,
                    severity: 'flagged'
                });
            }
        }
    }

    // 3.6 Schedule Tracking
    const currentDate = new Date(date).getTime();

    if (validatedData.quantities_reported && validatedData.quantities_reported.length > 0) {
        for (const reported of validatedData.quantities_reported) {
            const task = projectScheduleRepo.findByTaskName(projectId, reported.item_name);
            if (task) {
                // Sync task condition
                projectScheduleRepo.updateStatus(task.id, 'in_progress');

                const endDate = new Date(task.end_date).getTime();
                if (currentDate > endDate) {
                    violations.push({
                        rule_id: 'critical_delay',
                        type: 'critical_delay',
                        description: `Critical Delay: Work on '${task.task_name}' reported on ${date}, which is after its planned deadline (${task.end_date}).`,
                        severity: 'violation'
                    });
                }
            }
        }
    }

    // Check all tasks for unstarted risk
    const allTasks = projectScheduleRepo.findByProjectId(projectId);
    for (const task of allTasks) {
        if (task.status === 'not_started') {
            const startDate = new Date(task.start_date).getTime();
            if (currentDate > startDate) {
                violations.push({
                    rule_id: 'risk_of_delay',
                    type: 'risk_of_delay',
                    description: `Risk of Delay: Task '${task.task_name}' was scheduled to start on ${task.start_date} but hasn't been reported in any diary yet.`,
                    severity: 'flagged'
                });
            }
        }
    }

    // 4. Visual Evidence Audit (Multimodal)
    const visualAudit = await performVisualAudit(photos, rawText);
    if (!visualAudit.is_matching || visualAudit.mismatches.length > 0) {
        visualAudit.mismatches.forEach(m => {
            violations.push({
                rule_id: 'visual_mismatch',
                type: 'visual_mismatch',
                description: `Visual Evidence Mismatch: ${m}`,
                severity: 'violation'
            });
        });

        // Confidence reduction logic
        if (validatedData.confidence === 'high') {
            validatedData.confidence = 'medium';
        } else if (validatedData.confidence === 'medium') {
            validatedData.confidence = 'low';
        }
    }

    if (visualAudit.safety_violations && visualAudit.safety_violations.length > 0) {
        visualAudit.safety_violations.forEach(v => {
            violations.push({
                rule_id: 'safety_violation',
                type: 'safety_violation',
                description: `Visual Safety Issue: ${v}`,
                severity: 'violation' // Or 'flagged' depending on strictness
            });
        });
    }

    const hasViolations = violations.some(v => v.severity === 'violation');
    const hasFlags = violations.some(v => v.severity === 'flagged');
    const complianceStatus = hasViolations ? 'violation' : (hasFlags ? 'flagged' : 'compliant');

    // 5. Persist Diary Entry with Violations and Visual Summary
    const savedDiary = diaryRepo.create({
        project_id: projectId,
        date: date,
        raw_text: rawText,
        structured_data: JSON.stringify(validatedData),
        confidence: validatedData.confidence,
        source_refs: JSON.stringify(['voice_transcript', 'photos']),
        missing_data: validatedData.weather ? null : JSON.stringify(['weather']),
        needs_confirmation: true,
        rule_violations: JSON.stringify(violations),
        compliance_status: complianceStatus,
        visual_evidence_summary: visualAudit.visual_evidence_summary
    });

    // 4. Auto-extract issues
    if (validatedData.open_issues && validatedData.open_issues.length > 0) {
        for (const issue of validatedData.open_issues) {
            issuesRepo.create({
                project_id: projectId,
                source_diary_id: savedDiary.id,
                description: issue.description,
                status: issue.status,
                date: date
            });
        }
    }

    return savedDiary;
}
