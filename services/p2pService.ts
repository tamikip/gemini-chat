import { joinRoom } from 'trystero';
import { MessagePayload } from '../types';

let room: any;
let sendAction: any;

const APP_ID = 'nexus-p2p-chat-v1';

export const initP2P = (
  roomId: string, 
  onMessageReceived: (payload: MessagePayload) => void,
  onPeerUpdate: (peerCount: number) => void
) => {
  // Initialize the room
  const config = { appId: APP_ID };
  room = joinRoom(config, roomId);

  // Create an action for chat messages
  const [send, get] = room.makeAction('chat');
  sendAction = send;

  // Listen for incoming messages
  get((data: MessagePayload, peerId: string) => {
    console.log('Received P2P message from:', peerId);
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

  // Return a cleanup function
  return () => {
    if (room) {
      room.leave();
      room = null;
    }
  };
};

export const broadcastMessage = (payload: MessagePayload) => {
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