import React, { useState, useEffect, useRef } from 'react';
import { produce } from "https://esm.sh/immer@10.1.1";
import { GoogleGenAI } from "@google/genai";
import { FSNode } from '../../types';
import { get_node_by_path } from '../../constants';

// --- Syntax Highlighting ---

const highlight = (code: string) => {
    // A simple regex-based highlighter. Not perfect, but better than nothing for this environment.
    let highlightedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    highlightedCode = highlightedCode
        // Comments
        .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>')
        // JSX Tags and component names
        .replace(/(&lt;\/?\s*)([A-Z][a-zA-Z0-9]*)/g, '$1<span class="text-cyan-400">$2</span>') // Component tags
        .replace(/(&lt;\/?\s*)([a-z][a-z0-9-]*)/g, '$1<span class="text-pink-400">$2</span>') // HTML tags
        // Keywords
        .replace(/\b(import|from|export|default|const|let|var|function|return|if|else|switch|case|for|while|new|this|async|await|try|catch|finally|class|extends|super)\b/g, '<span class="text-purple-400">$1</span>')
        // React/Hooks
        .replace(/\b(React|useState|useEffect|useRef|useCallback|useMemo|useContext)\b/g, '<span class="text-cyan-400">$1</span>')
        // Attributes/Props
        .replace(/([a-zA-Z0-9]+)=/g, '<span class="text-yellow-300">$1</span>=')
        // Strings
        .replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span class="text-green-400">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
        // Booleans & null
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-orange-400">$1</span>')
        // Punctuation
        .replace(/([{}()[\].,;=><!+\-*/%&|?:]|=>)/g, `<span class="text-gray-400">$1</span>`);
        
    return highlightedCode;
};


const CodeEditor = ({ code, setCode }: { code: string, setCode: (code: string) => void }) => {
    const preRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="relative w-full h-full font-mono text-base leading-relaxed bg-[#1e1e1e]">
            <textarea
                ref={textareaRef}
                className="absolute top-0 left-0 w-full h-full bg-transparent border-none outline-none resize-none p-4 text-transparent caret-white selection:bg-blue-500/30 whitespace-pre"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={syncScroll}
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
            />
            <pre
                ref={preRef}
                className="absolute top-0 left-0 w-full h-full border-none outline-none resize-none p-4 pointer-events-none overflow-auto whitespace-pre"
                aria-hidden="true"
            >
                <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
            </pre>
        </div>
    );
};


// --- Main IDE Component ---

interface StarlightIDEProps {
    fs?: FSNode;
    setFs?: React.Dispatch<React.SetStateAction<FSNode>>;
    filePath?: string[];
}

export default function StarlightIDE({ fs, setFs, filePath }: StarlightIDEProps) {
    const [code, setCode] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        if (filePath && fs) {
            const node = get_node_by_path(fs, filePath);
            if (node && node.type === 'file' && typeof node.content === 'string') {
                setCode(node.content);
            } else {
                setCode(`// Error: Could not load file at /${filePath.join('/')}`);
            }
        }
    }, [fs, filePath]);

    const handleSave = () => {
        if (!filePath || !setFs) return;
        setFs(produce(draft => {
            const node = get_node_by_path(draft, filePath);
            if (node && node.type === 'file') {
                node.content = code;
            }
        }));
    };

    const handleAiRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim() || isAiLoading) return;

        setIsAiLoading(true);
        setAiError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const fullPrompt = `You are an expert developer assistant for StarOS. Your task is to modify the user's code based on their request.
The user is writing a StarScript application, which is a React component in a .star file.

**Instructions:**
1.  Analyze the user's current code and their request.
2.  Apply the requested changes directly to the code.
3.  **IMPORTANT**: Your response MUST be ONLY the complete, updated code within a single markdown block (e.g. \`\`\`jsx ... \`\`\`). Do not include any explanations, greetings, or other text outside the code block. The entire response will be used to replace the user's current file content.

Here is the user's current code:
\`\`\`jsx
${code}
\`\`\`

Here is the user's request: "${aiPrompt}"

Now, provide the complete, modified code:`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: fullPrompt,
            });
            
            const responseText = response.text;
            const match = responseText.match(/```(?:jsx|javascript|js)?\s*([\s\S]*?)```/);

            if (match && match[1]) {
                setCode(match[1].trim());
                setAiPrompt(''); // Clear prompt on success
            } else {
                setAiError("The AI returned an unexpected response. Please try again.");
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            setAiError("Sorry, I couldn't connect to the AI assistant. Check the console.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-slate-900 text-white flex flex-col">
            <header className="flex-shrink-0 h-14 flex items-center justify-between p-2 bg-slate-800/50 border-b border-white/10">
                <div className="font-mono text-sm pl-2">
                    {filePath ? `/${filePath.join('/')}` : 'Untitled.star'}
                </div>
                <button onClick={handleSave} className="px-4 py-1.5 rounded-md bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-sm font-semibold">
                    Save
                </button>
            </header>
            
            <main className="flex-grow relative">
                <CodeEditor code={code} setCode={setCode} />
                
                {/* AI Assistant Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
                    <div className="text-center text-xs mb-2 h-4">
                        {isAiLoading && <p className="text-gray-400 animate-pulse">Starlight Assistant is thinking...</p>}
                        {aiError && <p className="text-red-400">{aiError}</p>}
                    </div>
                    <form onSubmit={handleAiRequest}>
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
                            placeholder="Describe a change to the code..."
                            disabled={isAiLoading}
                        />
                    </form>
                </div>
            </main>
        </div>
    );
}
