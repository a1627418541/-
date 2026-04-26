import { useState, useCallback } from 'react';
import { streamChat, chatCompletion, type ChatMessage } from '../services/kimi';

export function useChat(systemPrompt?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, useStream = true) => {
      setError(null);
      const userMessage: ChatMessage = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        if (useStream) {
          const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
          setMessages([...newMessages, assistantMessage]);

          let fullContent = '';
          for await (const chunk of streamChat(newMessages, systemPrompt)) {
            fullContent += chunk;
            setMessages([
              ...newMessages,
              { role: 'assistant', content: fullContent },
            ]);
          }
        } else {
          const response = await chatCompletion(newMessages, systemPrompt);
          setMessages([
            ...newMessages,
            { role: 'assistant', content: response },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '发送消息失败');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
