import React, { useState, useRef, useEffect } from 'react';
import { produce } from "https://esm.sh/immer@10.1.1";
import { GoogleGenAI, FunctionDeclaration, Type, Chat, Tool, GenerateContentResponse } from "@google/genai";
import { SystemAgentProps, FSNode } from '../../types';
import { get_node_by_path } from '../../constants';


type HistoryItem = 
    | { type: 'user', text: string }
    | { type: 'agent-thought', text: string }
    | { type: 'agent-tool-result', text: string }
    | { type: 'agent-response', text: string }
    | { type: 'error', text: string };


const AgentIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v1.586a.75.75 0 00.29.585 12.013 12.013 0 001.21.751 12.013 12.013 0 001.21-.751.75.75 0 00.29-.585V4.741a7.525 7.525 0 012.743-1.012A.75.75 0 0011.25 4.533z" /><path d="M12.75 4.533A9.707 9.707 0 0118 3a9.735 9.735 0 013.25.555.75.75 0 01.5.707v1.586a.75.75 0 01-.29.585 12.013 12.013 0 01-1.21.751 12.013 12.013 0 01-1.21-.751.75.75 0 01-.29-.585V4.741a7.525 7.525 0 00-2.743-1.012.75.75 0 01-1.007-1.189z" /><path fillRule="evenodd" d="M12 21a8.25 8.25 0 006.284-2.486.75.75 0 01.992.428A9.75 9.75 0 0112 22.5a9.75 9.75 0 01-7.276-3.558.75.75 0 01.992-.428A8.25 8.25 0 0012 21z" clipRule="evenodd" /></svg>;
const UserIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>;


export default function StarOSAgent({ systemAgentProps }: { systemAgentProps?: SystemAgentProps }) {
    const [history, setHistory] = useState<HistoryItem[]>([
        { type: 'agent-response', text: 'Hello! I am the StarOS Agent. How can I help you today?' }
    ]);
    const [prompt, setPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    if (!systemAgentProps) {
        return <div className="w-full h-full bg-slate-900 text-red-400 p-4">Agent requires system access, but it was not provided.</div>;
    }
    
    const { fs, setFs, windows, openApp, closeWindow } = systemAgentProps;

    const tools: Tool[] = [{
        functionDeclarations: [
            {
                name: "getDirectoryListing",
                description: "Lists the contents of a directory at a given path.",
                parameters: {
                    type: Type.OBJECT, properties: {
                        path: { type: Type.ARRAY, description: "The path to the directory, as an array of strings. e.g. ['home', 'guest', 'Documents']", items: { type: Type.STRING } }
                    }, required: ['path']
                }
            },
            {
                name: 'createFile',
                description: 'Creates a new file at a given path with specified content. Overwrites the file if it already exists.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        path: { type: Type.ARRAY, description: "The full path for the new file, including the filename. e.g. ['home', 'guest', 'Documents', 'new-file.txt']", items: { type: Type.STRING } },
                        content: { type: Type.STRING, description: "The content to write into the file." }
                    }, required: ['path', 'content']
                }
            },
            {
                name: 'readFile',
                description: 'Reads and returns the content of a file at a given path.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        path: { type: Type.ARRAY, description: "The path to the file to read.", items: { type: Type.STRING } }
                    }, required: ['path']
                }
            },
            {
                name: 'deleteNode',
                description: 'Deletes a file or folder at a given path. This is permanent and cannot be undone.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        path: { type: Type.ARRAY, description: "The path to the file or folder to delete.", items: { type: Type.STRING } }
                    }, required: ['path']
                }
            },
            {
                name: 'openApp',
                description: 'Opens an application. Some applications can open a specific file.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        appId: { type: Type.STRING, description: "The ID of the app to open. e.g. 'terminal', 'orion', 'star-player'." },
                        filePath: { type: Type.ARRAY, description: "Optional: The path to a file to open with the app.", items: { type: Type.STRING } }
                    }, required: ['appId']
                }
            },
            {
                name: 'closeApp',
                description: 'Closes a running application window.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        windowId: { type: Type.STRING, description: "The ID of the window to close." },
                    }, required: ['windowId']
                }
            },
            {
                name: 'taskComplete',
                description: 'Call this function when the user\'s request has been fully completed.',
                parameters: {
                    type: Type.OBJECT, properties: {
                        reason: { type: Type.STRING, description: "A brief summary of how the task was completed." }
                    }, required: ['reason']
                }
            }
        ]
    }];

    const executeTool = (name: string, args: any) => {
        const path = args.path as string[] || [];
        const parentPath = path.slice(0, -1);
        const nodeName = path[path.length - 1];

        try {
            switch (name) {
                case 'getDirectoryListing': {
                    const node = get_node_by_path(fs, path);
                    if (node && node.type === 'folder' && Array.isArray(node.content)) {
                        return { success: true, listing: node.content.map(n => ({ name: n.name, type: n.type })) };
                    }
                    return { success: false, error: 'Directory not found or not a directory.' };
                }
                case 'createFile': {
                    let result: { success: boolean, error?: string } = { success: false, error: "Parent directory not found." };
                    setFs(produce(draft => {
                        const parent = get_node_by_path(draft, parentPath);
                        if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
                            const existingIndex = parent.content.findIndex(n => n.name === nodeName);
                            const newFile = { type: 'file' as const, name: nodeName, content: args.content };
                            if (existingIndex > -1) parent.content[existingIndex] = newFile;
                            else parent.content.push(newFile);
                            result = { success: true };
                        }
                    }));
                    return result;
                }
                case 'readFile': {
                    const node = get_node_by_path(fs, path);
                    if (node && node.type === 'file') return { success: true, content: node.content };
                    return { success: false, error: 'File not found or not a file.' };
                }
                case 'deleteNode': {
                     let result: { success: boolean, error?: string } = { success: false, error: "Parent directory not found." };
                    setFs(produce(draft => {
                        const parent = get_node_by_path(draft, parentPath);
                        if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
                            const nodeIndex = parent.content.findIndex(n => n.name === nodeName);
                            if (nodeIndex > -1) {
                                parent.content.splice(nodeIndex, 1);
                                result = { success: true };
                            } else {
                                result = { success: false, error: "File or folder not found." };
                            }
                        }
                    }));
                    return result;
                }
                case 'openApp':
                    openApp(args.appId, { filePath: args.filePath });
                    return { success: true, message: `Opening app ${args.appId}` };
                case 'closeApp':
                    closeWindow(args.windowId);
                    return { success: true, message: `Closing window ${args.windowId}` };
                case 'taskComplete':
                    return { success: true, reason: args.reason };
                default:
                    return { success: false, error: `Unknown tool: ${name}` };
            }
        } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
        }
    };


    const runAgent = async (userPrompt: string) => {
        setIsRunning(true);
        setHistory(prev => [...prev, { type: 'user', text: userPrompt }]);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const stringifyFS = (node: FSNode, indent = ''): string => {
            let result = `${indent}${node.name}/`;
            if (node.type === 'folder' && Array.isArray(node.content)) {
                for (const child of node.content) {
                    result += `\n${stringifyFS(child, indent + '  ')}`;
                }
            }
            return result;
        }

        const systemInstruction = `You are StarOS Agent, a helpful AI assistant integrated into a web-based operating system.
You can use tools to interact with the OS on the user's behalf.
Current OS State:
- Filesystem:
${stringifyFS(fs)}
- Open Windows:
${windows.length > 0 ? windows.map(w => `- ID: ${w.id}, App: ${w.appId}, Title: ${w.title}`).join('\n') : 'None'}

Think step-by-step. When the user's request is fully complete, you MUST call the "taskComplete" function.`;
        // FIX: The `tools` and `systemInstruction` parameters must be passed within a `config` object for chat creation.
        const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { tools, systemInstruction } });
        let response: GenerateContentResponse;
        
        try {
            response = await chat.sendMessage({ message: userPrompt });

            for (let i = 0; i < 10; i++) { // Safety break after 10 iterations
                const functionCalls = response.functionCalls;

                if (functionCalls && functionCalls.length > 0) {
                     setHistory(prev => [...prev, { type: 'agent-thought', text: `Calling ${functionCalls.map(fc => fc.name).join(', ')}...` }]);
                    
                    const toolResponses = [];
                    let taskIsComplete = false;
                    for (const fc of functionCalls) {
                        const result = executeTool(fc.name, fc.args);
                        if (fc.name === 'taskComplete') {
                            taskIsComplete = true;
                            // FIX: The `result` object's type is a union, and `reason` only exists on one variant. A type assertion is needed here to satisfy the compiler.
                            setHistory(prev => [...prev, { type: 'agent-response', text: (result as any).reason as string }]);
                            break;
                        }
                        toolResponses.push({ name: fc.name, id: fc.id, response: result });
                    }

                    setHistory(prev => [...prev, { type: 'agent-tool-result', text: `Tool results: ${JSON.stringify(toolResponses.map(tr => tr.response))}` }]);
                    
                    if (taskIsComplete) break;
                    
                    // FIX: The `sendMessage` method expects a `message` object containing parts for tool responses, not a `toolResponses` property.
                    response = await chat.sendMessage({
                      message: {
                        parts: toolResponses.map((tr) => ({
                          functionResponse: {
                            name: tr.name,
                            response: tr.response,
                          },
                        })),
                      },
                    });

                } else {
                    const text = response.text?.trim();
                    if(text) setHistory(prev => [...prev, { type: 'agent-response', text }]);
                    break;
                }
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setHistory(prev => [...prev, { type: 'error', text: `Error: ${errorMessage}` }]);
        } finally {
            setIsRunning(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isRunning) {
            runAgent(prompt);
            setPrompt('');
        }
    };

    return (
        <div className="w-full h-full bg-slate-900/80 text-white flex flex-col">
            <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
                {history.map((item, index) => (
                    <div key={index} className={`flex gap-3 items-start max-w-4xl mx-auto w-full ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {item.type.startsWith('agent') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><AgentIcon className="w-5 h-5 text-cyan-400" /></div>}
                        
                        <div className={`p-3 rounded-2xl ${
                            item.type === 'user' ? 'bg-[var(--accent-color)] rounded-br-none' :
                            item.type === 'agent-response' ? 'bg-slate-700 rounded-bl-none' :
                            item.type === 'agent-thought' ? 'bg-slate-800 text-gray-400 text-xs italic rounded-bl-none' :
                            item.type === 'agent-tool-result' ? 'bg-slate-800 text-purple-400 text-xs font-mono rounded-bl-none' :
                            'bg-red-800/50 rounded-bl-none'
                        }`}>
                            <pre className="whitespace-pre-wrap font-sans text-sm">{item.text}</pre>
                        </div>

                         {item.type === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-300" /></div>}
                    </div>
                ))}
                <div ref={endOfMessagesRef} />
            </div>
            <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-900">
                 <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all disabled:opacity-50"
                        placeholder={isRunning ? "Agent is working..." : "Ask the agent to do something..."}
                        disabled={isRunning}
                    />
                 </form>
            </div>
        </div>
    );
}
