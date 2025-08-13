import { MockProvider } from './provider.mock.js';

// Convert CommonJS modules to ES6 imports
import ProviderFactory from './providerFactory.js';

export function getProvider() {
  try {
    // Use the factory to create the default provider
    return ProviderFactory.createDefaultProvider();
  } catch (error) {
    console.warn(
      `Failed to create provider: ${error.message}, falling back to mock`
    );
    return new MockProvider();
  }
}

// Export the factory for direct access if needed
export { ProviderFactory };
