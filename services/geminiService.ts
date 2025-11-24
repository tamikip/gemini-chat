import { GoogleGenAI, Chat } from "@google/genai";
import { Message, SenderType, MessageType } from "../types";
import { AI_PEER_ID } from "../constants";

// Initialize the client.
// Note: In a real production app, ensure the API key is not exposed to the client if possible,
// or use Firebase App Check/Proxy. For this demo, we use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Simulates a P2P partner using Gemini.
 * It takes the current chat history and generates a response as if it were another user in the room.
 */
export const generatePeerResponse = async (
  currentMessages: Message[],
  roomId: string
): Promise<string> => {
  try {
    // Construct the history for the chat model
    // Filter out system messages for better context
    const conversationHistory = currentMessages
      .filter((m) => m.type === MessageType.TEXT)
      .map((m) => ({
        role: m.senderType === SenderType.SELF ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    // The last message is the trigger, remove it from history to initialize chat correctly if needed,
    // or just pass the whole history up to the last point. 
    // However, ai.chats.create expects history to NOT include the message we are about to send? 
    // Actually, we are simulating the *other* person. So the 'user' (real human) just sent a message.
    // We want the 'model' (AI Peer) to respond.
    
    // We need to treat the 'history' as previous turns.
    const historyForModel = conversationHistory.slice(0, -1);
    const lastUserMessage = conversationHistory[conversationHistory.length - 1];

    if (!lastUserMessage) return "Hello!";

    const chat: Chat = ai.chats.create({
      model: MODEL_NAME,
      history: historyForModel,
      config: {
        systemInstruction: `You are a casual, friendly user in a P2P chat room. 
        Your Room ID is ${roomId}. 
        Do NOT act like an AI assistant. Act like a human peer named 'Alex'. 
        Keep responses concise, conversational, and sometimes use emojis. 
        Don't be overly formal.`,
      },
    });

    const result = await chat.sendMessage({ message: lastUserMessage.parts[0].text });
    return result.text || "...";
  } catch (error) {
    console.error("Gemini Peer Error:", error);
    return "Connection instability detected... (AI Error)";
  }
};

/**
 * Summarizes the conversation so far using Gemini.
 */
export const summarizeConversation = async (messages: Message[]): Promise<string> => {
  if (messages.length === 0) return "No conversation to summarize.";

  const transcript = messages
    .filter(m => m.type === MessageType.TEXT)
    .map(m => `${m.senderType === SenderType.SELF ? 'Me' : 'Peer'}: ${m.text}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Summarize the following chat conversation in 3 concise bullet points:\n\n${transcript}`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Error generating summary.";
  }
};