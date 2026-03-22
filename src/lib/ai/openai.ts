import OpenAI from 'openai';
import { AIProvider, AIProviderResponse } from './provider';

// This respects the dependency injection pattern
export class OpenAIAdapter implements AIProvider {
    private openai: OpenAI;

    constructor(apiKey?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }

    async generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: any,
        schemaName: string,
        description: string
    ): Promise<AIProviderResponse<T>> {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o', // or gpt-4o-2024-08-06 which supports strict schemas
            temperature: 0.0, // We want deterministic outputs
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: schemaName,
                    description: description,
                    schema: schema,
                    strict: true
                }
            }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('OpenAI returned empty content');
        }

        return {
            data: JSON.parse(content) as T,
            rawResponse: content
        };
    }

    async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0.1,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });

        return response.choices[0].message.content || '';
    }
}

// Lazy singleton — only instantiated on first actual request, not at module load time.
// This prevents "Missing credentials" errors during `next build` when OPENAI_API_KEY isn't set.
let _aiProvider: OpenAIAdapter | null = null;
export const aiProvider = {
    get instance(): OpenAIAdapter {
        if (!_aiProvider) _aiProvider = new OpenAIAdapter();
        return _aiProvider;
    },
    generateText(systemPrompt: string, userPrompt: string): Promise<string> {
        return this.instance.generateText(systemPrompt, userPrompt);
    },
    generateStructured<T>(...args: Parameters<OpenAIAdapter['generateStructured']>): ReturnType<OpenAIAdapter['generateStructured']> {
        return this.instance.generateStructured<T>(...args) as ReturnType<OpenAIAdapter['generateStructured']>;
    }
};
