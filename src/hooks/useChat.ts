import { useState, FormEvent } from 'react';
import { Message } from '../types';
import { GoogleGenAI } from '@google/genai';

export function useChat(ai: GoogleGenAI | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const dummyMessages: Message[] = [
        { id: '1', text: 'Hello! How can I assist you today?', sender: 'bot', isMarkdown: true },
        { id: '2', text: 'Feel free to ask me anything about our services.', sender: 'bot', isMarkdown: true },
        { id: '3', text: 'I can help you with account issues, product information, and more.', sender: 'bot', isMarkdown: true },
        { id: '4', text: 'Just type your question below and I will do my best to assist you!', sender: 'bot', isMarkdown: true }
    ];
    if (messages.length === 0) {
        setMessages(dummyMessages);
    }

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