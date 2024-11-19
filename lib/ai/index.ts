import { Ollama } from 'ollama';

export const ollamaClient = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434'
});

export async function generateWithOllama({ 
  model, 
  messages, 
  stream = false 
}: { 
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}) {
  return ollamaClient.chat({
    model,
    messages,
    stream
  });
}
