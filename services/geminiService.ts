import { GoogleGenAI, Chat } from "@google/genai";
import { Message, SenderType, MessageType } from "../types";
import { AI_PEER_ID } from "../constants";

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to safely get the client instance
// This prevents top-level crashes if process is undefined in some browser environments
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from process.env");
    // We return null or throw, but for the UI to load, we handle this in the caller
    throw new Error("API Key not configured");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Simulates a P2P partner using Gemini.
 * It takes the current chat history and generates a response as if it were another user in the room.
 */
export const generatePeerResponse = async (
  currentMessages: Message[],
  roomId: string
): Promise<string> => {
  try {
    const ai = getAiClient();

    // Construct the history for the chat model
    // Filter out system messages for better context
    const conversationHistory = currentMessages
      .filter((m) => m.type === MessageType.TEXT)
      .map((m) => ({
        role: m.senderType === SenderType.SELF ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

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

  try {
    const ai = getAiClient();
    
    const transcript = messages
      .filter(m => m.type === MessageType.TEXT)
      .map(m => `${m.senderType === SenderType.SELF ? 'Me' : 'Peer'}: ${m.text}`)
      .join('\n');

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