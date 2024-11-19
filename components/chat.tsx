'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { models } from '@/lib/ai/models';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  const { mutate } = useSWRConfig();

  const [streamContent, setStreamContent] = useState('');

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
    isStreaming: hookIsStreaming,
  } = useChat({
    api: '/api/chat',
    id,
    body: {
      id,
      model: models.find(m => m.id === selectedModelId)
    },
    initialMessages,
    onResponse: (response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let lastContent = '';

      async function readStream() {
        if (!reader) return;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') {
                  setIsStreaming(false);
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.completed) {
                    console.log('Received final chat state');
                    setIsStreaming(false);
                    return;
                  }
                  
                  const newContent = parsed.content.slice(lastContent.length);
                  lastContent = parsed.content;
                  setStreamContent(prev => prev + newContent);
                } catch (e) {
                  console.error('Failed to parse chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
        } finally {
          reader.releaseLock();
          mutate('/api/history');
        }
      }

      readStream();
    },
    onFinish: () => {
      console.log('Stream completed via onFinish');
      setIsStreaming(false);
      mutate('/api/history');
    },
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmitWithStreaming = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsStreaming(true);
    setStreamContent('');
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error('Error submitting chat:', error);
      setIsStreaming(false);
    }
  };

  const showLoading = isLoading || isStreaming || hookIsStreaming;

  const displayMessages = useMemo(() => {
    if (!streamContent || messages.length === 0) return messages;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      return [...messages, {
        id: 'streaming',
        role: 'assistant',
        content: streamContent,
        createdAt: new Date()
      }];
    }
    
    return messages.map((msg, i) => 
      i === messages.length - 1 ? { ...msg, content: streamContent } : msg
    );
  }, [messages, streamContent]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
        >
          {messages.length === 0 && <Overview />}

          {displayMessages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={showLoading && displayMessages.length - 1 === index}
              vote={
                votes
                  ? votes.find((vote) => vote.messageId === message.id)
                  : undefined
              }
            />
          ))}

          {showLoading &&
            displayMessages.length > 0 &&
            displayMessages[displayMessages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form onSubmit={handleSubmitWithStreaming} className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmitWithStreaming}
            isLoading={showLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
      </div>

      <AnimatePresence>
        {block?.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmitWithStreaming}
            isLoading={showLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            votes={votes}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
