import { joinRoom } from 'trystero';
import { MessagePayload } from '../types';

let room: any;
let sendAction: any;
let broadcastChannel: BroadcastChannel | null = null;

const APP_ID = 'nexus-p2p-chat-v1';

export const initP2P = (
  roomId: string, 
  onMessageReceived: (payload: MessagePayload) => void,
  onPeerUpdate: (peerCount: number) => void
) => {
  // --- 1. BroadcastChannel (Local Tabs) ---
  // This allows tabs on the same browser to talk instantly without internet
  try {
    const channelName = `nexus_local_${APP_ID}_${roomId}`;
    broadcastChannel = new BroadcastChannel(channelName);
    
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'CHAT_MSG') {
        // console.log('[BroadcastChannel] Received:', event.data.payload);
        onMessageReceived(event.data.payload);
      }
    };
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }

  // --- 2. Trystero (WebRTC over Torrent Trackers) ---
  // This connects different devices over the internet
  const config = { appId: APP_ID };
  
  // Using the torrent strategy (imported in index.html)
  room = joinRoom(config, roomId);

  const [send, get] = room.makeAction('chat');
  sendAction = send;

  // Listen for P2P messages
  get((data: MessagePayload, peerId: string) => {
    // console.log('[Trystero] Received from:', peerId);
    onMessageReceived(data);
  });

  // Listen for peer join/leave events
  room.onPeerJoin((peerId: string) => {
    console.log('Peer joined:', peerId);
    updatePeerCount(onPeerUpdate);
  });

  room.onPeerLeave((peerId: string) => {
    console.log('Peer left:', peerId);
    updatePeerCount(onPeerUpdate);
  });

  // Initial count
  updatePeerCount(onPeerUpdate);

  // Cleanup
  return () => {
    if (room) {
      room.leave();
      room = null;
    }
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  };
};

export const broadcastMessage = (payload: MessagePayload) => {
  // 1. Send to local tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'CHAT_MSG', payload });
  }

  // 2. Send to internet peers
  if (sendAction) {
    sendAction(payload);
  } else {
    console.warn("P2P Send Action not initialized");
  }
};

const updatePeerCount = (callback: (count: number) => void) => {
  if (room) {
    const peers = room.getPeers();
    // Trystero getPeers returns an object where keys are peer IDs
    callback(Object.keys(peers).length);
  } else {
    callback(0);
  }
};