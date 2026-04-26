import React from 'react';
import type { ChatMessage as ChatMessageType } from '../services/kimi';

interface Props {
  message: ChatMessageType;
}

const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar">
        {isUser ? '你' : '🤖'}
      </div>
      <div className="bubble">
        <p>{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
