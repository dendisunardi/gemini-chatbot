import { useState, FormEvent } from 'react';
import { Message } from '../types';
import { GoogleGenAI } from '@google/genai';

export function useChat(ai: GoogleGenAI | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (!ai) {
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, text: "AI service is not available.", sender: 'error' }]);
            return;
        }

        const userMessageText = inputValue.trim();
        if (!userMessageText) return;

        const newUserMessage: Message = { id: `user-${Date.now()}`, text: userMessageText, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        const streamingMessageId = `bot-message-${Date.now()}`;
        const botPlaceholderMessage: Message = { id: streamingMessageId, text: '', sender: 'bot', isStreaming: true, isMarkdown: true };
        setMessages(prev => [...prev, botPlaceholderMessage]);

        try {
            const responseStream = await ai.models.generateContentStream({
                model: "gemini-2.5-flash-preview-04-17",
                contents: userMessageText,
            });

            let fullResponseText = "";
            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponseText += chunkText;
                    setMessages(prev => prev.map(msg => 
                        msg.id === streamingMessageId ? { ...msg, text: fullResponseText } : msg
                    ));
                }
            }
            
            setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId ? { ...msg, text: fullResponseText, isStreaming: false } : msg
            ));

            if (fullResponseText.trim() === "") {
                setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
            }

        } catch (e) {
            console.error("Error generating content:", e);
            let detailMessage = "Sorry, something went wrong while generating a response.";
            if (e instanceof Error) {
                detailMessage += ` Details: ${e.message}`;
            }
            setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, text: detailMessage, sender: 'error' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isLoading,
        handleSendMessage
    };
}