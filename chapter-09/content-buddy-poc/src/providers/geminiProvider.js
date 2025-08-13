import { Provider } from './provider.base.js';

class GeminiProvider extends Provider {
  constructor(apiKey, options = {}) {
    super();
    this.apiKey = apiKey;
    this.baseURL =
      options.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = options.model || 'gemini-1.5-pro';
    this.defaultMaxTokens = options.maxTokens || 2000;
    this.defaultTemperature = options.temperature || 0.7;
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || this.defaultMaxTokens;
    const temperature = options.temperature || this.defaultTemperature;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 10,
      },
    };

    try {
      const response = await fetch(
        `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} - ${
            error.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0
      ) {
        throw new Error('No content parts returned from Gemini API');
      }

      return candidate.content.parts[0].text;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API');
      }
      throw error;
    }
  }
}

export default GeminiProvider;
