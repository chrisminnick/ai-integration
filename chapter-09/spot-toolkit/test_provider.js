#!/usr/bin/env node

// Simple test script to verify provider selection works
import { ProviderManager } from './src/utils/providerManager.js';

async function testProviderSelection() {
  const manager = new ProviderManager();

  console.log('Testing provider creation...');

  // Test mock provider
  console.log('\n1. Testing mock provider:');
  try {
    const mockProvider = await manager.getProvider('mock');
    console.log('✅ Mock provider created successfully');
    const mockResult = await mockProvider.generateText('Test prompt');
    console.log(
      '✅ Mock provider generates text:',
      mockResult.substring(0, 100) + '...'
    );
  } catch (error) {
    console.log('❌ Mock provider failed:', error.message);
  }

  // Test OpenAI provider (should fail without API key)
  console.log('\n2. Testing OpenAI provider (without API key):');
  try {
    const openaiProvider = await manager.getProvider('openai');
    if (openaiProvider.constructor.name === 'MockProvider') {
      console.log(
        '✅ Correctly fell back to mock provider due to missing API key'
      );
    } else {
      console.log('⚠️  OpenAI provider created (unexpected without API key)');
    }
  } catch (error) {
    console.log('✅ Expected error for OpenAI without API key:', error.message);
  }

  // Test with fake API key
  console.log('\n3. Testing OpenAI provider (with fake API key):');
  process.env.OPENAI_API_KEY = 'fake-key-for-testing';
  try {
    const openaiProvider = await manager.getProvider('openai');
    console.log('✅ OpenAI provider created with fake API key');
    console.log('   Provider class:', openaiProvider.constructor.name);
  } catch (error) {
    console.log('❌ OpenAI provider creation failed:', error.message);
  }

  console.log('\nProvider selection test completed!');
}

testProviderSelection().catch(console.error);
