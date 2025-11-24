import React, { useState } from 'react';
import { JoinScreen } from './components/JoinScreen';
import { ChatScreen } from './components/ChatScreen';
import { User } from './types';
import { AVATAR_PLACEHOLDERS } from './constants';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'join' | 'chat'>('join');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleJoin = (username: string, room: string) => {
    // In a real P2P app, we would initialize WebRTC/Sockets here.
    const user: User = {
      id: Date.now().toString(),
      username,
      avatarUrl: AVATAR_PLACEHOLDERS[Math.floor(Math.random() * AVATAR_PLACEHOLDERS.length)],
    };
    
    setCurrentUser(user);
    setRoomId(room);
    setCurrentScreen('chat');
  };

  const handleLeave = () => {
    setCurrentUser(null);
    setRoomId(null);
    setCurrentScreen('join');
  };

  return (
    <main className="w-full h-screen bg-nexus-900 text-gray-100 font-sans antialiased">
      {currentScreen === 'join' && <JoinScreen onJoin={handleJoin} />}
      {currentScreen === 'chat' && currentUser && roomId && (
        <ChatScreen 
          roomId={roomId} 
          currentUser={currentUser} 
          onLeave={handleLeave} 
        />
      )}
    </main>
  );
};

export default App;