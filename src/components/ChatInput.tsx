import { FormEvent, useRef } from 'react';

interface ChatInputProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSendMessage: (event: FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    error: string | null;
    ai: any;
}

export function ChatInput({ 
    inputValue, 
    setInputValue, 
    handleSendMessage, 
    isLoading, 
    error, 
    ai 
}: ChatInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <footer>
            <form id="chat-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    id="chat-input"
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={error && !ai ? "Chat disabled due to AI initialization error." : "Ask something..."}
                    aria-label="Chat input"
                    autoComplete="off"
                    disabled={isLoading || (!ai && !!error)}
                />
                <button 
                    type="submit" 
                    id="send-button" 
                    aria-label="Send message" 
                    disabled={isLoading || !inputValue.trim() || (!ai && !!error)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </form>
        </footer>
    );
}