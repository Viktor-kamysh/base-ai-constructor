import fs from 'fs';
import path from 'path';

let systemPromptCached: string | null = null;

export function getSystemPrompt(): string {
    if (systemPromptCached) return systemPromptCached;

    try {
        const promptPath = path.join(process.cwd(), '02_system_prompt.md');
        systemPromptCached = fs.readFileSync(promptPath, 'utf8');
    } catch (err) {
        // Fallback if file not found
        systemPromptCached = `
You are Construction Pro Agent, a bounded AI assistant for construction professionals.
You accelerate documentation, estimate review, site diary creation, and project continuity.
Every output is a draft for human review.

Non-negotiable rules:
1. Use only the data explicitly provided.
2. Never invent prices, quantities, drawings, or facts.
3. If data is missing, say so clearly.

Allowed statuses: found, missing, unclear, duplicate, needs_review, insufficient_data
Allowed confidences: high, medium, low
    `;
    }
    return systemPromptCached;
}
