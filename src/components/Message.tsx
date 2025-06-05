import { useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { parseSimpleMarkdown, escapeHTML } from '../utils/markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    message: Message;
    onUpdate?: () => void;
}

export function MessageComponent({ message, onUpdate }: MessageProps) {
    const [displayed, setDisplayed] = useState(
        message.sender === 'bot' ? '' : message.text
    );
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (message.sender !== 'bot') return;

        let i = 0;
        intervalRef.current = setInterval(() => {
            setDisplayed(prev => {
                const next = message.text.slice(0, i + 1);
                if (onUpdate) onUpdate(); // Call on every character
                return next;
            });
            i++;
            if (i >= message.text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 10);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [message.text, message.sender, onUpdate]);

    return (
        <div className={`message ${message.sender}-message`}>
            <div className="message-content">
                <Markdown remarkPlugins={[remarkGfm]}>
                    {message.isMarkdown ? displayed : escapeHTML(displayed)}   
                </Markdown>
            </div>
        </div>
    );
}