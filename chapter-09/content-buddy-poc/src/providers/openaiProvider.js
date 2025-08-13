import { Provider } from './provider.base.js';

class OpenAIProvider extends Provider {
  constructor(apiKey, options = {}) {
    super();
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://api.openai.com/v1';
    this.defaultModel = options.model || 'gpt-4';
    this.defaultMaxTokens = options.maxTokens || 2000;
    this.defaultTemperature = options.temperature || 0.7;
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || this.defaultMaxTokens;
    const temperature = options.temperature || this.defaultTemperature;

    const payload = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${
            error.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to OpenAI API');
      }
      throw error;
    }
  }
}

export default OpenAIProvider;
