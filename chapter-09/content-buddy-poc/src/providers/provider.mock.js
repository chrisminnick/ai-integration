// A minimal mock provider that echos the compiled prompt and simulates latency.
export class MockProvider {
  async callModel(compiledPrompt) {
    const start = Date.now();
    const synthesized = this._synthesize(compiledPrompt);
    const latencyMs = Date.now() - start;
    return { output: synthesized, latencyMs };
  }

  _synthesize(compiled) {
    const { system, user, stylePack, templateMeta } = compiled;
    // For the POC, just return a structured preview of what would be sent.
    return JSON.stringify({
      _preview: "Mock provider preview of request",
      template: templateMeta,
      system,
      user
    }, null, 2);
  }
}
