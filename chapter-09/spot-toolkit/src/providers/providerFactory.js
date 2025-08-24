import MockProvider from './mockProvider.js';
import OpenAIProvider from './openaiProvider.js';
import AnthropicProvider from './anthropicProvider.js';
import GeminiProvider from './geminiProvider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProviderFactory {
  static loadConfig() {
    try {
      const configPath = path.join(__dirname, '../../configs/providers.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Provider config not found, using defaults');
      return {
        defaultProvider: 'openai',
        providers: {
          openai: { model: 'gpt-4', maxTokens: 2000, temperature: 0.7 },
          anthropic: {
            model: 'claude-3-sonnet-20240229',
            maxTokens: 2000,
            temperature: 0.7,
          },
          gemini: {
            model: 'gemini-1.5-pro',
            maxTokens: 2000,
            temperature: 0.7,
          },
        },
      };
    }
  }

  static createProvider(type, apiKey, options = {}) {
    const config = this.loadConfig();
    const providerConfig = config.providers[type?.toLowerCase()] || {};
    const mergedOptions = { ...providerConfig, ...options };

    switch (type.toLowerCase()) {
      case 'mock':
        return new MockProvider(mergedOptions);
      case 'openai':
        if (!apiKey) throw new Error('API key required for OpenAI provider');
        return new OpenAIProvider(apiKey, mergedOptions);
      case 'anthropic':
        if (!apiKey) throw new Error('API key required for Anthropic provider');
        return new AnthropicProvider(apiKey, mergedOptions);
      case 'gemini':
        if (!apiKey) throw new Error('API key required for Gemini provider');
        return new GeminiProvider(apiKey, mergedOptions);
      default:
        throw new Error(
          `Unknown provider type: ${type}. Supported types: mock, openai, anthropic, gemini`
        );
    }
  }

  static createDefaultProvider() {
    const config = this.loadConfig();
    const defaultType = process.env.PROVIDER || config.defaultProvider;
    const apiKey = this.getApiKey(defaultType);

    if (!apiKey && defaultType !== 'mock') {
      console.warn(
        `No API key found for ${defaultType}, falling back to mock provider`
      );
      return this.createProvider('mock');
    }

    return this.createProvider(defaultType, apiKey);
  }

  static getApiKey(providerType) {
    switch (providerType?.toLowerCase()) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'gemini':
        return process.env.GEMINI_API_KEY;
      default:
        return null;
    }
  }
}

export default ProviderFactory;
