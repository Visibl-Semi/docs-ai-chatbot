'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MentionPopup } from './mention-popup';

const suggestedActions = [
  {
    title: 'Show a block diagram',
    label: 'for this design.',
    action: 'Generate and display a block diagram for the current semiconductor design.',
  },
  {
    title: 'What does this module do?',
    label: 'in the current design?',
    action: 'Explain the functionality of this module in the current semiconductor design.',
  },
  {
    title: 'Explain timing constraints',
    label: 'for this design.',
    action: 'Explain the timing constraints and how they impact the current semiconductor design.',
  },
  {
    title: 'Compare parameters',
    label: 'across design files.',
    action: 'Create a comparison table of key parameters and configurations across different design files.',
  },
];

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<Set<string>>(new Set());

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInput(value);
    adjustHeight();

    if (value.slice(-1) === '@') {
      const textarea = textareaRef.current;
      if (textarea) {
        const caretCoords = getCaretCoordinates(textarea, textarea.selectionEnd);
        const rect = textarea.getBoundingClientRect();
        
        setMentionPosition({
          top: rect.top - caretCoords.top + 24,
          left: rect.left + caretCoords.left - 620,
        });
        setShowMentionPopup(true);
        setMentionFilter('');
      }
    } else if (showMentionPopup) {
      const lastAtIndex = value.lastIndexOf('@');
      if (lastAtIndex >= 0) {
        const filterText = value.slice(lastAtIndex + 1);
        if (filterText.includes(' ')) {
          setShowMentionPopup(false);
          setMentionFilter('');
        } else {
          setMentionFilter(filterText);
        }
      } else {
        setShowMentionPopup(false);
        setMentionFilter('');
      }
    }
  };

  const handleMentionSelect = (mention: string) => {
    const currentInput = input;
    const lastAtIndex = currentInput.lastIndexOf('@');
    const newInput = currentInput.slice(0, lastAtIndex) + mention + ' ';
    setInput(newInput);
    setSelectedMentions(prev => new Set([...prev, mention]));
    setShowMentionPopup(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const renderStyledInput = (text: string) => {
    const parts = text.split(/(@[\w.-]+(?:\s|$))/).map((part, index) => {
      if (part.match(/@[\w.-]+(?:\s|$)/) && selectedMentions.has(part.trim())) {
        return (
          <span 
            key={index} 
            className="bg-blue-500/10 text-blue-500 rounded px-1 -mx-1"
          >
            {part}
          </span>
        );
      }
      return part;
    });
    return parts;
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <MentionPopup
        isVisible={showMentionPopup}
        position={mentionPosition}
        onSelect={handleMentionSelect}
        searchTerm={mentionFilter}
      />

      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-2 w-full">
            {suggestedActions.map((suggestedAction, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index }}
                key={`suggested-action-${suggestedAction.title}-${index}`}
                className={index > 1 ? 'hidden sm:block' : 'block'}
              >
                <Button
                  variant="ghost"
                  onClick={async () => {
                    window.history.replaceState({}, '', `/chat/${chatId}`);

                    append({
                      role: 'user',
                      content: suggestedAction.action,
                    });
                  }}
                  className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                >
                  <span className="font-medium">{suggestedAction.title}</span>
                  <span className="text-muted-foreground">
                    {suggestedAction.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <div 
          className={cx(
            'absolute top-0 left-0 w-full p-3 pointer-events-none',
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden'
          )}
        >
          {renderStyledInput(input)}
        </div>
        <Textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted',
            'text-transparent caret-foreground',
            className,
          )}
          rows={3}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (showMentionPopup) {
                event.preventDefault();
                return; // Let the MentionPopup handle the Enter key
              }
              
              if (!event.shiftKey) {
                event.preventDefault();

                if (isLoading) {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }
          }}
        />
      </div>

      {isLoading ? (
        <Button
          className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
          onClick={(event) => {
            event.preventDefault();
            stop();
            setMessages((messages) => sanitizeUIMessages(messages));
          }}
        >
          <StopIcon size={14} />
        </Button>
      ) : (
        <Button
          className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
          onClick={(event) => {
            event.preventDefault();
            submitForm();
          }}
          disabled={input.length === 0 || uploadQueue.length > 0}
        >
          <ArrowUpIcon size={14} />
        </Button>
      )}

      <Button
        className="rounded-full p-1.5 h-fit absolute bottom-2 right-11 m-0.5 dark:border-zinc-700"
        onClick={(event) => {
          event.preventDefault();
          fileInputRef.current?.click();
        }}
        variant="outline"
        disabled={isLoading}
      >
        <PaperclipIcon size={14} />
      </Button>
    </div>
  );
}

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const { offsetLeft: elementLeft, offsetTop: elementTop } = element;
  const div = document.createElement('div');
  const styles = getComputedStyle(element);
  const properties = [
    'boxSizing', 'width', 'height', 'padding', 'border', 'lineHeight',
    'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing'
  ];

  properties.forEach(prop => {
    div.style[prop as any] = styles[prop];
  });

  div.textContent = element.value.substring(0, position);
  
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
  document.body.removeChild(div);

  return {
    left: spanLeft + elementLeft,
    top: spanTop + elementTop
  };
}
