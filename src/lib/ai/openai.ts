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

// Default export instance (singleton)
export const aiProvider = new OpenAIAdapter();
