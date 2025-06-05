import Head from 'next/head';
import { useRef, useEffect } from 'react';
import { MessageComponent } from '../src/components/Message';
import { useAI } from '../src/hooks/useAI';
import { useChat } from '../src/hooks/useChat';
import { ChatInput } from '../src/components/ChatInput';

export default function ChatPage() {
    const { ai, error } = useAI();
    const { messages, inputValue, setInputValue, isLoading, handleSendMessage } = useChat(ai);
    const chatOutputRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        if (chatOutputRef.current) {
            chatOutputRef.current.scrollTo({
                top: chatOutputRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

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
                <main 
                    id="chat-container"
                    aria-live="polite"
                    aria-busy={isLoading}
                    aria-label="Chat messages"
                    ref={chatOutputRef}
                    style={{
                        overflowY: 'auto',
                        height: 'calc(100vh - 150px)', // Adjust based on header/footer height
                        padding: '1rem',
                    }}
                >
                    <div id="chat-output">
                        {messages.map((msg, idx) => (
                            <MessageComponent 
                                key={msg.id} 
                                message={msg}
                                onUpdate={
                                    idx === messages.length - 1 ? scrollToBottom : undefined 
                                }
                            />
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