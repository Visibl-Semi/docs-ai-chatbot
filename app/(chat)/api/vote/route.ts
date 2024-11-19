import { getVotesByChatId, voteMessage } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  try {
    const votes = await getVotesByChatId({ id: chatId });
    return Response.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return Response.json([], { status: 200 }); // Return empty array instead of error
  }
}

export async function PATCH(request: Request) {
  try {
    const {
      chatId,
      messageId,
      type,
    }: { chatId: string; messageId: string; type: 'up' | 'down' } =
      await request.json();

    if (!chatId || !messageId || !type) {
      return new Response('messageId and type are required', { status: 400 });
    }

    await voteMessage({
      chatId,
      messageId,
      type,
    });

    return new Response('Message voted', { status: 200 });
  } catch (error) {
    console.error('Error voting message:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
