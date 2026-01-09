export class AIService {
    private static instance: AIService;

    private constructor() { }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Mocks the Gemini Multimodal Analysis.
     * In production, this would send the screenshot + query to Vertex AI / Gemini API.
     */
    public async getCoordinates(query: string, _screenshotBase64: string): Promise<{ x: number, y: number } | null> {
        console.log(`[AIService] Analyzing screenshot for: "${query}"...`);

        // Simulate Processing Delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Logic: Return fixed coordinates if we are looking for "Login Button" in our known mock context
        if (query.toLowerCase().includes('login') || query.toLowerCase().includes('button')) {
            console.log('[AIService] Identified target: Login Button');
            return { x: 220, y: 350 }; // Same coords as our hardcoded mock
        }

        console.warn('[AIService] target not found in visual analysis');
        return null; // Not found
    }
}
