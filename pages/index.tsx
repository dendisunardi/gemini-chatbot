import Head from 'next/head';
import { useRef } from 'react';
import { MessageComponent } from '../src/components/Message';
import { useAI } from '../src/hooks/useAI';
import { useChat } from '../src/hooks/useChat';
import { ChatInput } from '../src/components/ChatInput';

export default function ChatPage() {
    const { ai, error } = useAI();
    const { messages, inputValue, setInputValue, isLoading, handleSendMessage } = useChat(ai);
    const chatOutputRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Head>
                <title>Dendi Chatbot</title>
                <meta name="description" content="A simple Q&A/chatbot application powered by the Gemini API." />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>" />
            </Head>
            <div id="app-container">
                <header>
                    <h1>Dendi Chatbot</h1>
                </header>
                <main id="chat-container" aria-live="polite">
                    <div id="chat-output" ref={chatOutputRef}>
                        {messages.map(msg => (
                            <MessageComponent key={msg.id} message={msg} />
                        ))}
                    </div>
                    {isLoading && (
                        <div id="loading-indicator" role="status">
                            <div className="spinner"></div>
                            <p>Thinking...</p>
                        </div>
                    )}
                </main>
                <ChatInput
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    error={error}
                    ai={ai}
                />
            </div>
        </>
    );
}