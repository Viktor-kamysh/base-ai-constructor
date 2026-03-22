export interface AIProviderResponse<T> {
    data: T;
    rawResponse: string;
}

export interface AIProvider {
    /**
     * Generates structured data strictly adhering to a JSON schema.
     */
    generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: any,
        schemaName: string,
        description: string
    ): Promise<AIProviderResponse<T>>;

    /**
     * Extract unstructured text to text (like transcript summarization).
     */
    generateText(
        systemPrompt: string,
        userPrompt: string
    ): Promise<string>;
}
