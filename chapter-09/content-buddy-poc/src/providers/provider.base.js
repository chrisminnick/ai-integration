export class Provider {
  async generateText(prompt, options = {}) {
    throw new Error('generateText method must be implemented by subclass');
  }
}
