import { deleteChatById, getChatById } from '@/lib/db/queries';
import { Message } from 'ai';
import { generateWithOllama } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  
  console.log('Initial chat state:', {
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1],
    model: model.apiIdentifier
  });

  try {
    const response = await generateWithOllama({
      model: model.apiIdentifier,
      messages: messages.map((m: Message) => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    });

    console.log('Stream initialized with model:', model.apiIdentifier);

    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let text = '';
          let chunkCount = 0;
          
          for await (const chunk of response) {
            chunkCount++;
            const newText = chunk.message.content;
            text += newText;
            
            console.log('Stream state:', {
              chunkNumber: chunkCount,
              newChunkContent: newText,
              totalLength: text.length
            });
            
            // Send the complete text so far
            const message = {
              id: messageId,
              role: 'assistant',
              content: text,
              createdAt: new Date()
            };
            
            // Format as SSE
            const sseMessage = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
          }
          
          console.log('Final chat state:', {
            messageId,
            totalChunks: chunkCount,
            finalLength: text.length,
            completed: true
          });
          
          // Signal stream completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error state:', {
            messageId,
            error: error.message,
            phase: 'streaming'
          });
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {

    });
  }
}
