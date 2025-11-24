import React, { useState, useEffect, useRef } from 'react';
import { Message, User, SenderType, MessageType } from '../types';
import { generatePeerResponse, summarizeConversation } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { Button } from './Button';
import { AI_PEER_ID } from '../constants';

interface ChatScreenProps {
  roomId: string;
  currentUser: User;
  onLeave: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ roomId, currentUser, onLeave }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize room
  useEffect(() => {
    setMessages([
      {
        id: 'sys-init',
        text: `Connected to Room: ${roomId}`,
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now(),
        type: MessageType.SYSTEM,
      },
      {
        id: 'sys-info',
        text: 'Waiting for peer connection...',
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now() + 100,
        type: MessageType.SYSTEM,
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      senderId: currentUser.id,
      senderType: SenderType.SELF,
      timestamp: Date.now(),
      type: MessageType.TEXT,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    if (isAiMode) {
      setIsTyping(true);
      // Simulate network delay + thinking time
      const delay = 1000 + Math.random() * 1000;
      
      try {
        // We need to pass the state *including* the new message, but setState is async.
        // So we recreate the array locally for the service call.
        const currentHistory = [...messages, userMsg];
        const responseText = await generatePeerResponse(currentHistory, roomId);
        
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            senderId: AI_PEER_ID,
            senderType: SenderType.PEER,
            timestamp: Date.now(),
            type: MessageType.TEXT,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        }, delay);
      } catch (e) {
        setIsTyping(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAiMode = () => {
    if (!isAiMode) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Gemini Agent activated as Peer.',
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now(),
        type: MessageType.SYSTEM,
      }]);
    } else {
       setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Gemini Agent disconnected.',
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now(),
        type: MessageType.SYSTEM,
      }]);
    }
    setIsAiMode(!isAiMode);
  };

  const handleSummarize = async () => {
    setShowSummary(true);
    setIsSummarizing(true);
    const summary = await summarizeConversation(messages);
    setSummaryText(summary);
    setIsSummarizing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-nexus-900 text-white overflow-hidden relative">
      {/* Header */}
      <header className="h-16 border-b border-nexus-700 bg-nexus-800/90 backdrop-blur flex items-center justify-between px-4 lg:px-6 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <h2 className="font-bold text-lg tracking-wide">Room: {roomId}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              User: <span className="text-nexus-400">{currentUser.username}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={handleSummarize}
            title="Summarize Chat with AI"
            className="hidden sm:flex"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </Button>
          <Button 
            variant={isAiMode ? "primary" : "secondary"}
            onClick={toggleAiMode}
            className="text-xs px-3"
            title={isAiMode ? "Disable AI Peer" : "Enable AI Peer"}
          >
             {isAiMode ? 'AI Active' : 'Enable AI'}
          </Button>
          <Button variant="danger" onClick={onLeave} className="text-xs px-3">
            Leave
          </Button>
        </div>
      </header>

      {/* Summary Modal (Inline for simplicity) */}
      {showSummary && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-nexus-800 border border-nexus-600 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-nexus-400">Gemini Summary</h3>
            <div className="bg-nexus-900/50 p-4 rounded-lg min-h-[100px] text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {isSummarizing ? (
                 <div className="flex items-center justify-center h-full gap-2">
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce delay-150"></span>
                 </div>
              ) : summaryText}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowSummary(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2 custom-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-nexus-700 rounded-2xl rounded-tl-sm px-4 py-3 border border-nexus-600 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-nexus-800 border-t border-nexus-700">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            className="flex-1 bg-nexus-900/50 border border-nexus-600 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-nexus-400 focus:ring-1 focus:ring-nexus-400 transition-all"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputText.trim() || isTyping}
            className="px-6 rounded-xl"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </Button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 text-center">
           <p className="text-[10px] text-gray-500">
             {isAiMode ? "AI Simulation Active (Gemini 2.5)" : "P2P Mode (Simulated for Demo)"}
           </p>
        </div>
      </div>
    </div>
  );
};