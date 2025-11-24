import React, { useState, useEffect, useRef } from 'react';
import { Message, User, SenderType, MessageType, MessagePayload } from '../types';
import { summarizeConversation } from '../services/geminiService';
import { initP2P, broadcastMessage } from '../services/p2pService';
import { MessageBubble } from './MessageBubble';
import { Button } from './Button';

interface ChatScreenProps {
  roomId: string;
  currentUser: User;
  onLeave: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ roomId, currentUser, onLeave }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [peerCount, setPeerCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Dedup Set to prevent processing the same message ID twice (from different channels)
  const processedMessageIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize P2P Connection
  useEffect(() => {
    // Reset messages and dedupe set on room change
    setMessages([
      {
        id: 'sys-init',
        text: `Secure Channel Established. Room: ${roomId}`,
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now(),
        type: MessageType.SYSTEM,
      },
      {
        id: 'sys-wait',
        text: 'Waiting for peers to join (Broadcast & P2P)...',
        senderId: 'system',
        senderType: SenderType.SYSTEM,
        timestamp: Date.now() + 100,
        type: MessageType.SYSTEM,
      }
    ]);
    processedMessageIds.current = new Set();

    const cleanup = initP2P(
      roomId,
      (payload: MessagePayload) => {
        // Deduplication check
        if (processedMessageIds.current.has(payload.id)) {
          return;
        }
        processedMessageIds.current.add(payload.id);

        // Handle incoming message
        const newMsg: Message = {
          id: payload.id,
          text: payload.text,
          senderId: payload.senderId,
          senderType: SenderType.PEER, // We received it, so it's a PEER
          username: payload.username,
          timestamp: payload.timestamp,
          type: MessageType.TEXT,
        };
        setMessages(prev => [...prev, newMsg]);
      },
      (count) => {
        setPeerCount(count);
        // Add system message if peer count changes positively
        if (count > 0) {
           setMessages(prev => {
             // Only add if the last message wasn't already a "connected" message to avoid spam
             const last = prev[prev.length - 1];
             if (last && last.text.includes(`${count} Peer`)) return prev;
             
             return [...prev, {
               id: `sys-peer-${Date.now()}`,
               text: `Network Update: ${count} Peer(s) Connected`,
               senderId: 'system',
               senderType: SenderType.SYSTEM,
               timestamp: Date.now(),
               type: MessageType.SYSTEM,
             }];
           });
        }
      }
    );

    return () => {
      cleanup();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const timestamp = Date.now();
    const msgId = `${currentUser.id}-${timestamp}`;

    // Mark as processed so we don't re-add it if we receive our own broadcast
    processedMessageIds.current.add(msgId);

    // 1. Update Local UI
    const userMsg: Message = {
      id: msgId,
      text: inputText,
      senderId: currentUser.id,
      senderType: SenderType.SELF,
      timestamp: timestamp,
      type: MessageType.TEXT,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Broadcast to Peers (Local & Remote)
    const payload: MessagePayload = {
      id: msgId,
      text: inputText,
      senderId: currentUser.id,
      username: currentUser.username,
      timestamp: timestamp,
    };
    broadcastMessage(payload);

    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${peerCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            {peerCount > 0 && <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></div>}
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-wide flex items-center gap-2">
              Room <span className="font-mono text-nexus-400 bg-nexus-900 px-2 py-0.5 rounded text-sm">{roomId}</span>
            </h2>
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
            <span className="hidden md:inline ml-1 text-xs">Summary</span>
          </Button>
          <div className="bg-nexus-900 px-3 py-1.5 rounded-lg border border-nexus-700 text-xs text-nexus-400 font-mono">
            {peerCount} Peers
          </div>
          <Button variant="danger" onClick={onLeave} className="text-xs px-3">
            Disconnect
          </Button>
        </div>
      </header>

      {/* Summary Modal */}
      {showSummary && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-nexus-800 border border-nexus-600 rounded-xl p-6 max-w-lg w-full shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-nexus-400">Mission Report</h3>
            <div className="bg-nexus-900/50 p-4 rounded-lg min-h-[100px] text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isSummarizing ? (
                 <div className="flex items-center justify-center h-full gap-2 py-8">
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce delay-150"></span>
                 </div>
              ) : summaryText}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowSummary(false)}>Close Report</Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id}>
             {/* Show username for peers */}
             {msg.senderType === SenderType.PEER && msg.username && (
               <div className="flex justify-start mb-0.5 px-1">
                  <span className="text-[10px] text-nexus-400 font-bold">{msg.username}</span>
               </div>
             )}
             <MessageBubble message={msg} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-nexus-800 border-t border-nexus-700">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            className="flex-1 bg-nexus-900/50 border border-nexus-600 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-nexus-400 focus:ring-1 focus:ring-nexus-400 transition-all"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputText.trim()}
            className="px-6 rounded-xl"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </Button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 text-center flex justify-center gap-4">
           <p className="text-[10px] text-gray-500">
             Encrypted Channel: <span className="text-nexus-400">{roomId}</span>
           </p>
           <p className="text-[10px] text-gray-500">
             Status: {peerCount > 0 ? "Online (P2P Connected)" : "Broadcasting (Hybrid Mode)..."}
           </p>
        </div>
      </div>
    </div>
  );
};