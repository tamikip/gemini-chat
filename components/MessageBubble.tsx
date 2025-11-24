import React from 'react';
import { Message, SenderType, MessageType } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.type === MessageType.SYSTEM) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs font-mono text-nexus-400 bg-nexus-800/50 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  const isSelf = message.senderType === SenderType.SELF;

  return (
    <div className={`flex w-full mb-4 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-5 py-3 rounded-2xl text-sm md:text-base shadow-md break-words ${
            isSelf
              ? 'bg-nexus-500 text-white rounded-tr-sm'
              : 'bg-nexus-700 text-gray-100 rounded-tl-sm border border-nexus-600'
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-gray-500 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};