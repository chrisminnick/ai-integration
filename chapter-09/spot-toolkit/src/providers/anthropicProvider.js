import { Provider } from './provider.base.js';

class AnthropicProvider extends Provider {
  constructor(apiKey, options = {}) {
    super();
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://api.anthropic.com/v1';
    this.defaultModel = options.model || 'claude-3-sonnet-20240229';
    this.defaultMaxTokens = options.maxTokens || 2000;
    this.defaultTemperature = options.temperature || 0.7;
    this.anthropicVersion = options.anthropicVersion || '2023-06-01';
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || this.defaultMaxTokens;
    const temperature = options.temperature || this.defaultTemperature;

    const payload = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    };

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error: ${response.status} - ${
            error.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error('No content returned from Anthropic API');
      }

      // Anthropic returns content as an array of objects
      return data.content[0].text;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Anthropic API');
      }
      throw error;
    }
  }
}

export default AnthropicProvider;
