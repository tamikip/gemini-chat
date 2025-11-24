import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface JoinScreenProps {
  onJoin: (username: string, roomId: string) => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;
    
    setIsLoading(true);
    // Simulate connection delay
    setTimeout(() => {
      onJoin(username, roomId);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-nexus-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-nexus-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-nexus-800/80 backdrop-blur-xl border border-nexus-600 rounded-2xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nexus-400 to-nexus-accent">
            Nexus Link
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Secure P2P Chat Environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Display Name" 
            placeholder="Enter your alias..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          
          <Input 
            label="Room ID" 
            placeholder="e.g. 8080, room-alpha..." 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            disabled={!username.trim() || !roomId.trim()}
          >
            Connect to Node
          </Button>

          <div className="mt-6 p-4 bg-nexus-900/50 rounded-lg border border-nexus-700/50">
            <h3 className="text-xs font-semibold text-nexus-400 uppercase tracking-wider mb-2">
              System Info
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              This environment uses an encrypted conceptual channel. 
              If no peer is found on the matched ID, an AI emulator (Gemini 2.5) 
              can be activated for connectivity testing.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};