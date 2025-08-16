/**
 * Configuration Management System
 *
 * Centralized configuration loading, validation, and management
 */

import fs from 'fs';
import path from 'path';
import { ValidationError } from './errorHandling.js';

export class ConfigManager {
  constructor(configDir) {
    this.configDir = configDir;
    this.cache = new Map();
  }

  async loadConfig(configName, schema = null) {
    if (this.cache.has(configName)) {
      return this.cache.get(configName);
    }

    const configPath = path.join(this.configDir, `${configName}.json`);

    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      if (schema) {
        this.validateConfig(config, schema, configName);
      }

      this.cache.set(configName, config);
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ValidationError(
          `Configuration file not found: ${configName}.json`,
          'config_file',
          configName
        );
      }
      throw new ValidationError(
        `Invalid JSON in configuration: ${configName}.json`,
        'config_format',
        error.message
      );
    }
  }

  validateConfig(config, schema, configName) {
    for (const [key, requirements] of Object.entries(schema)) {
      if (requirements.required && !(key in config)) {
        throw new ValidationError(
          `Missing required configuration: ${key}`,
          `${configName}.${key}`,
          undefined
        );
      }

      if (key in config) {
        const value = config[key];

        if (requirements.type && typeof value !== requirements.type) {
          throw new ValidationError(
            `Configuration ${key} must be of type ${requirements.type}`,
            `${configName}.${key}`,
            value
          );
        }

        if (requirements.enum && !requirements.enum.includes(value)) {
          throw new ValidationError(
            `Configuration ${key} must be one of: ${requirements.enum.join(
              ', '
            )}`,
            `${configName}.${key}`,
            value
          );
        }

        if (requirements.validator && !requirements.validator(value)) {
          throw new ValidationError(
            `Configuration ${key} failed validation`,
            `${configName}.${key}`,
            value
          );
        }
      }
    }
  }

  // Environment variable integration
  getConfigWithEnvOverrides(config, envMappings = {}) {
    const result = { ...config };

    for (const [configKey, envVar] of Object.entries(envMappings)) {
      if (process.env[envVar]) {
        // Parse environment variables appropriately
        let value = process.env[envVar];

        // Try to parse as JSON for complex values
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if not valid JSON
          }
        } else if (
          value.toLowerCase() === 'true' ||
          value.toLowerCase() === 'false'
        ) {
          value = value.toLowerCase() === 'true';
        } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
          value = parseFloat(value);
        }

        this.setNestedValue(result, configKey, value);
      }
    }

    return result;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Configuration schemas
export const PROVIDER_CONFIG_SCHEMA = {
  defaultProvider: {
    required: true,
    type: 'string',
    enum: ['openai', 'anthropic', 'gemini', 'mock'],
  },
  providers: {
    required: true,
    type: 'object',
  },
  timeout: {
    type: 'number',
    validator: (val) => val > 0 && val <= 300000, // 5 minutes max
  },
  retryAttempts: {
    type: 'number',
    validator: (val) => val >= 0 && val <= 10,
  },
};

export const STYLE_CONFIG_SCHEMA = {
  brand_voice: { required: true, type: 'string' },
  reading_level: { required: true, type: 'string' },
  must_use: { type: 'object' },
  must_avoid: { type: 'object' },
  terminology: { type: 'object' },
};
