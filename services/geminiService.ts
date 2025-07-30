import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from '../types';

// Ensure the API key is available, otherwise throw an error.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are Driver Buddy, an expert AI assistant for UK-based professional drivers, specializing in union rules, driving laws, and employment rights. Your knowledge base includes the 'Big Red Book (Unite)', Transport for London (TfL) agreements, and general UK driver regulations. Answer questions clearly and concisely. Be supportive, helpful, and empower the driver with information. Do not invent rules or laws; if you don't know, say so.`;

let chat: Chat | null = null;

function initializeChat() {
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
}

export async function getChatbotResponse(history: ChatMessage[], newMessage: string): Promise<string> {
  try {
    if (!chat) {
        initializeChat();
    }
    
    // The history is managed in the UI component state, we just need to send the latest message.
    // The `chat` object maintains the conversation history internally.
    const result = await (chat as Chat).sendMessage({ message: newMessage });
    return result.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Reset chat on error in case session is invalid
    chat = null;
    return "I'm sorry, I encountered an error. Please try again. If the problem persists, please restart the chat.";
  }
}
