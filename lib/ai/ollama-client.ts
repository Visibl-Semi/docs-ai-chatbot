import { Ollama } from 'ollama';

export const createOllamaClient = () => {
  return new Ollama({
    host: process.env.OLLAMA_HOST || 'http://localhost:11434'
  });
}; 