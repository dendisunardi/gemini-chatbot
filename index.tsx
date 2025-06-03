
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// API key should be set via environment variable
const API_KEY = process.env.API_KEY as string;

const chatOutput = document.getElementById('chat-output') as HTMLDivElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;

let ai: GoogleGenAI | null = null;

// --- Utility function to escape HTML ---
function escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// --- Simple Markdown to HTML Parser ---
function parseSimpleMarkdown(md: string): string {
    let html = md;

    // 1. Code blocks (```lang\ncode\n``` or ```code```)
    // Must be processed first, and content within escaped.
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/gs, (_match, _lang, code) => {
        return `<pre><code>${escapeHTML(code)}</code></pre>`;
    });
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
        return `<pre><code>${escapeHTML(code.trim())}</code></pre>`;
    });

    // Process remaining segments that are not inside <pre>...</pre>
    const parts = html.split(/(<pre(?:>|[\s\S]*?<\/code>)<\/pre>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('<pre>')) {
            continue; // Skip already processed code blocks
        }

        let segment = parts[i];

        // Headings (H3, H2, H1 - order matters for specificity)
        // Applied before inline styles so inline markdown within headings is parsed.
        segment = segment.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        segment = segment.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        segment = segment.replace(/^# (.*)$/gm, '<h1>$1</h1>');

        // Inline code (`code`) - content escaped
        segment = segment.replace(/`([^`]+?)`/g, (_match, codeContent) => `<code>${escapeHTML(codeContent)}</code>`);

        // Links ([text](url)) - text and URL parts escaped for security
        segment = segment.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, (_match, text, url) =>
            `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a>`
        );

        // Bold (**text**)
        segment = segment.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italics (*text*) - Ensure it doesn't conflict with bold if ** is followed by *
        segment = segment.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        // Strikethrough (~~text~~)
        segment = segment.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Convert newlines to <br> for segments not part of other complex structures
        // This ensures multi-line text is displayed correctly.
        if (segment.trim() !== '') {
             segment = segment.replace(/\n/g, '<br>');
        }
        parts[i] = segment;
    }
    html = parts.join('');

    // Remove <br> tags that might be directly inside <pre> due to the global newline replacement.
    html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, codeContent) => {
        return `<pre><code${attrs}>${codeContent.replace(/<br\s*\/?>/g, '\n')}</code></pre>`;
    });

    // Remove <br> tags immediately following closing heading tags if they were created from the same line's newline.
    html = html.replace(/(<\/(?:h1|h2|h3)>)<br\s*\/?>/gi, '$1');

    

    return html;
}


try {
    if (!API_KEY) {
        throw new Error("API_KEY is not set. Please ensure the API_KEY environment variable is configured.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    const errorMessage = error instanceof Error ? error.message : "API Key might be missing or invalid.";
    addMessageToChat(`Error: Could not initialize AI. ${errorMessage}`, "error");
    if (sendButton) sendButton.disabled = true;
    if (chatInput) chatInput.disabled = true;
}


function addMessageToChat(message: string, sender: 'user' | 'bot' | 'error', isStreamingPlaceholder: boolean = false, messageId?: string): HTMLElement | null {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message');
    if (messageId) {
        messageWrapper.id = messageId;
    }

    const messageContentContainer = document.createElement('div');
    messageContentContainer.classList.add('message-content');

    if (sender === 'user') {
        messageWrapper.classList.add('user-message');
        messageContentContainer.textContent = message; // User messages are plain text
    } else if (sender === 'bot') {
        messageWrapper.classList.add('bot-message');
        if (isStreamingPlaceholder) {
            // Content will be added/updated by streaming functions
            messageContentContainer.textContent = ''; // Start empty for streaming
        } else {
            // For non-streaming bot messages (e.g., welcome message)
            messageContentContainer.innerHTML = parseSimpleMarkdown(message);
        }
    } else if (sender === 'error') {
        messageWrapper.classList.add('error-message');
        messageContentContainer.textContent = message; // Error messages are plain text
    }

    messageWrapper.appendChild(messageContentContainer);
    chatOutput.appendChild(messageWrapper);
    scrollToBottom();
    return messageWrapper; // Return the wrapper
}

function updateStreamingMessage(messageId: string, chunk: string) {
    const messageWrapper = document.getElementById(messageId);
    if (messageWrapper) {
        const contentContainer = messageWrapper.querySelector('.message-content') as HTMLDivElement;
        if (contentContainer) {
            contentContainer.textContent += chunk; // Append raw text during streaming
            scrollToBottom();
        }
    }
}

function finalizeStreamingMessage(messageId: string, fullMessage: string) {
    const messageWrapper = document.getElementById(messageId);
    if (messageWrapper) {
        const contentContainer = messageWrapper.querySelector('.message-content') as HTMLDivElement;
        if (contentContainer) {
            contentContainer.innerHTML = parseSimpleMarkdown(fullMessage); // Parse and set final HTML
            scrollToBottom();
        }
    }
}


function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

function setLoading(isLoading: boolean) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        sendButton.disabled = true;
        chatInput.disabled = true;
    } else {
        loadingIndicator.classList.add('hidden');
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
    }
}

async function handleSendMessage(event: Event) {
    event.preventDefault();
    if (!ai) {
        addMessageToChat("AI service is not available.", "error");
        return;
    }

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addMessageToChat(userMessage, 'user');
    chatInput.value = '';
    setLoading(true);

    const streamingMessageId = `bot-message-${Date.now()}`;
    // Add a placeholder for the bot's message that will be streamed into
    addMessageToChat("", 'bot', true, streamingMessageId);

    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userMessage,
        });

        let fullResponse = "";
        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                updateStreamingMessage(streamingMessageId, chunkText);
            }
        }

        if (fullResponse.trim() === "") {
            // If the response was empty, remove the placeholder message
            const emptyMessageDiv = document.getElementById(streamingMessageId);
            if (emptyMessageDiv) emptyMessageDiv.remove();
        } else {
            // Finalize the message with parsed Markdown
            finalizeStreamingMessage(streamingMessageId, fullResponse);
        }

    } catch (error) {
        console.error("Error generating content:", error);
        let errorMessage = "Sorry, something went wrong while generating a response.";
        if (error instanceof Error) {
            errorMessage += ` Details: ${error.message}`;
        }
        // Remove the potentially partial streaming message div on error
        const partialMessageDiv = document.getElementById(streamingMessageId);
        if (partialMessageDiv) partialMessageDiv.remove();
        addMessageToChat(errorMessage, "error");
    } finally {
        setLoading(false);
    }
}

if (chatForm && ai) {
    chatForm.addEventListener('submit', handleSendMessage);
} else if (!ai && chatForm) {
    // If AI failed to init, ensure form reflects this.
    // Error message already added during AI initialization failure.
    if (sendButton) sendButton.disabled = true;
    if (chatInput) chatInput.disabled = true;
    if (chatInput) chatInput.placeholder = "Chat disabled due to AI initialization error.";
}

if (chatInput && !chatInput.disabled) {
    chatInput.focus();
}

window.addEventListener('load', () => {
    if (ai) {
        addMessageToChat("Hello! I'm a Gemini-powered chatbot. How can I help you today?", "bot");
    } else {
        // If AI isn't initialized, don't show welcome message or ensure it indicates an issue
        // This case is mostly handled by the AI initialization block, but as a fallback:
        if (!document.querySelector('.error-message')) { // Avoid duplicate generic error
             addMessageToChat("Chatbot is currently unavailable.", "error");
        }
    }
});
