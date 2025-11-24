export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
}

export enum SenderType {
  SELF = 'SELF',
  PEER = 'PEER',
  SYSTEM = 'SYSTEM',
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderType: SenderType;
  timestamp: number;
  type: MessageType;
  username?: string; // Optional for display
}

export interface MessagePayload {
  id: string;
  text: string;
  senderId: string;
  username: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string | null;
  users: User[];
  messages: Message[];
  isAiPeerEnabled: boolean;
}