'use server';

import { type CoreUserMessage } from 'ai';
import { cookies } from 'next/headers';
import { generateWithOllama } from '@/lib/ai';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const response = await generateWithOllama({
    model: DEFAULT_MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: `Generate a short title (max 80 chars) summarizing the user's message. No quotes or colons.`
      },
      {
        role: 'user',
        content: message.content
      }
    ]
  });

  return response.message.content;
}
