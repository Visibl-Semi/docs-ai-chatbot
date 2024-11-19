import type { Experimental_LanguageModelV1Middleware } from 'ai';

export const customMiddleware: Experimental_LanguageModelV1Middleware = {
  async chatCompletion(request, options) {
    // Transform messages for Ollama format if needed
    return {
      messages: request.messages,
      options
    };
  }
};
