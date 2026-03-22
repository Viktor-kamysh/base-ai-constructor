import { GoogleGenerativeAI } from '@google/generative-ai';

// Instantiate the Gemini AI client
// Ensure GEMINI_API_KEY is available in your .env or process.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');

export interface VisualAuditResult {
    visual_evidence_summary: string;
    is_matching: boolean;
    mismatches: string[];
    safety_violations: string[];
}

export async function performVisualAudit(
    base64Images: { mimeType: string, data: string }[],
    diaryText: string
): Promise<VisualAuditResult> {
    try {
        // If no images are provided, we can't perform a visual audit
        if (!base64Images || base64Images.length === 0) {
            return {
                visual_evidence_summary: 'No photos provided for visual audit.',
                is_matching: true,
                mismatches: [],
                safety_violations: []
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
Сравни этот текст дневника стройки с этими фотографиями. Подтверди:
1. Действительно ли на фото изображены описанные работы?
2. Соответствует ли объем работ на фото заявленному в тексте?
3. Видны ли нарушения ТБ (отсутствие касок, ограждений)?

Текст дневника:
${diaryText}

Ответь строго в формате JSON:
{
  "visual_evidence_summary": "Краткое описание того, что реально видно на фото.",
  "is_matching": true/false (true если все сходится, false если критические расхождения),
  "mismatches": ["список", "расхождений", "если есть"],
  "safety_violations": ["список", "нарушений ТБ", "если есть"]
}
        `;

        const imageParts = base64Images.map(img => ({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType
            }
        }));

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();

        // Clean JSON from markdown block if any
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        }

        return JSON.parse(jsonStr) as VisualAuditResult;

    } catch (error) {
        console.error("Gemini Visual Audit failed:", error);
        // Fallback for MVP if key is missing or API fails
        return {
            visual_evidence_summary: 'Visual audit failed or skipped (API error or mock mode).',
            is_matching: true, // Fail-open for MVP
            mismatches: [],
            safety_violations: []
        };
    }
}
