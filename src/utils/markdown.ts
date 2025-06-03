import Markdown from 'react-markdown';
export function escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// export function convertToMarkdown(text: string): string {
    
//     let html = text;


// }

export function parseSimpleMarkdown(md: string): string {
    let html = md;

    // Code blocks with language - improved to handle no language specified
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_match, lang, code) => {
        const language = lang ? ` class="language-${lang}"` : '';
        const escapedCode = escapeHTML(code.trim());
        return `<pre><code${language}>${escapedCode}</code></pre>`;
    });

    // Inline code blocks
    html = html.replace(/`([^`]+?)`/g, (_match, code) => {
        return `<code>${escapeHTML(code)}</code>`;
    });

    // Headers
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

 // ... existing code ...
    html = html.replace(/^(\s*)(\d+\.\s+)(.*)$/gm, (_match, indent, _num, content) => {
        // We will use a placeholder to mark list items and their indentation levels
        // The actual <li> tag will be added in the processOrderedLists function
        const indentDepth = indent.length;
        return `ITEM_PLACEHOLDER_OL_${indentDepth} ${content}`;
    });

    const processOrderedLists = (text: string): string => {
        const lines = text.split('\n');
        let inList = false;
        let currentIndent = -1;
        const resultLines: string[] = [];
        const indentStack: number[] = [];

        for (const line of lines) {
            const match = line.match(/^ITEM_PLACEHOLDER_OL_(\d+) (.*)/);
            if (match) {
                const indent = parseInt(match[1], 10);
                const content = match[2];

                if (!inList) {
                    resultLines.push('<ol>');
                    inList = true;
                    currentIndent = indent;
                    indentStack.push(indent);
                } else if (indent > currentIndent) {
                    resultLines.push('<ol>');
                    indentStack.push(indent);
                    currentIndent = indent;
                } else if (indent < currentIndent) {
                    while (indentStack.length > 0 && indentStack[indentStack.length - 1] > indent) {
                        resultLines.push('</ol>');
                        indentStack.pop();
                    }
                    if (indentStack.length === 0 || indentStack[indentStack.length - 1] !== indent) {
                        // This case implies a jump in indentation that doesn't align with the stack
                        // or the list ended and a new one at a shallower indent started.
                        // For simplicity, we'll close all open lists and start a new one.
                        while(indentStack.length > 0) {
                            resultLines.push('</ol>');
                            indentStack.pop();
                        }
                        resultLines.push('<ol>');
                        indentStack.push(indent);
                    }
                    currentIndent = indent;
                }
                resultLines.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    while (indentStack.length > 0) {
                        resultLines.push('</ol>');
                        indentStack.pop();
                    }
                    inList = false;
                    currentIndent = -1;
                }
                resultLines.push(line);
            }
        }

        if (inList) {
            while (indentStack.length > 0) {
                resultLines.push('</ol>');
                indentStack.pop();
            }
        }
        return resultLines.join('\n').replace(/ITEM_PLACEHOLDER_OL_\d+ /g, ''); // Clean up any remaining placeholders
    };

    html = processOrderedLists(html);

    // Unordered Lists - improved to handle nested lists and multiple digits
// ... existing code ...

    // Unordered Lists
    html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Bold, italic, strikethrough
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links
    html = html.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, (_match, text, url) =>
        `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a>`
    );

    // Blockquotes - improved to handle nested blockquotes and multiple lines
    html = html.replace(/^(>+\s*)(.*)$/gm, (_match, quotes, content) => {
        const level = quotes.trim().length;
        return `<blockquote data-level="${level}">${content}</blockquote>`;
    });
    // Process nested blockquotes
    const processBlockquotes = (text: string): string => {
        return text.replace(/(?:^|\n)(<blockquote[^>]*>.*<\/blockquote>(?:\n|$))+/g, (match) => {
            const quotes = match.trim().split('\n');
            let currentLevel = 0;
            let result = '';
            const stack: string[] = [];

            quotes.forEach(quote => {
                const level = parseInt(quote.match(/data-level="(\d+)"/)?.[1] || '0');
                quote = quote.replace(/ data-level="\d+"/, '');

                while (level > currentLevel) {
                    result += '<blockquote>';
                    stack.push('</blockquote>');
                    currentLevel++;
                }
                while (level < currentLevel) {
                    result += stack.pop() || '';
                    currentLevel--;
                }
                result += quote.replace(/^<blockquote>|<\/blockquote>$/g, '');
            });

            while (stack.length > 0) {
                result += stack.pop();
            }
            return `<blockquote>${result}</blockquote>`;
        });
    };
    html = processBlockquotes(html);

    // Tables (basic support)
    html = html.replace(/^\|(.+)\|$/gm, (_match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`;
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');

    // Line breaks
    const parts = html.split(/(<(?:pre|h[1-6]|ul|ol|blockquote|table)[^>]*>[\s\S]*?<\/(?:pre|h[1-6]|ul|ol|blockquote|table)>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<')) {
            parts[i] = parts[i].replace(/\n/g, '<br>');
        }
    }
    html = parts.join('');

    return html;
}