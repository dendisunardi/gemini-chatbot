export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot' | 'error';
    isStreaming?: boolean;
    isMarkdown?: boolean;
}