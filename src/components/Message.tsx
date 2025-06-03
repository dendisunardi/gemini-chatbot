import { Message } from '../types';
import { parseSimpleMarkdown, escapeHTML } from '../utils/markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    message: Message;
}

export function MessageComponent({ message }: MessageProps) {
    return (
        <div className={`message ${message.sender}-message`}>
            <div className="message-content">
                <Markdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                </Markdown>
            </div>
        </div>
    );
}