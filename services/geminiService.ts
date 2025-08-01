import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from '../types';

// Initialize AI only if API key is available
let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const systemInstruction = `You are Driver Buddy, an expert AI assistant for UK-based professional drivers, specializing in union rules, driving laws, and employment rights. Your knowledge base includes the 'Big Red Book (Unite)', Transport for London (TfL) agreements, and general UK driver regulations. Answer questions clearly and concisely. Be supportive, helpful, and empower the driver with information. Do not invent rules or laws; if you don't know, say so.`;

let chat: Chat | null = null;

function initializeChat() {
  if (!ai) {
    throw new Error("AI service not available - API key not configured");
  }
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
}

export async function getChatbotResponse(history: ChatMessage[], newMessage: string): Promise<string> {
  try {
    if (!ai) {
      return "AI chatbot is not available. Please configure your API key to use this feature.";
    }
    
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
    if (error instanceof Error && error.message.includes("API key not configured")) {
      return "AI chatbot is not available. Please configure your API key to use this feature.";
    }
    return "I'm sorry, I encountered an error. Please try again. If the problem persists, please restart the chat.";
  }
}
