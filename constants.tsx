import React from 'react';
import { AppConfig, ThemeColors, FSNode } from './types';

// App components
import Stardrive from './components/apps/Finder';
import Terminal from './components/apps/Terminal';
import Notes from './components/apps/Notes';
import Settings from './components/apps/Settings';
import TextEdit from './components/apps/TextEdit';
import Orion from './components/apps/Orion';
import StarlightIDE from './components/apps/StarlightIDE';
import StarPlayer from './components/apps/StarPlayer';
import StarOSAgent from './components/apps/StarOSAgent';


// Icons (placeholders)
const FolderIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19.5 21a3 3 0 003-3v-7.5a3 3 0 00-3-3h-9a3 3 0 00-3 3v7.5a3 3 0 003 3h9z" /><path d="M16.5 7.5a3 3 0 00-3-3h-9a3 3 0 00-3 3v7.5a3 3 0 003 3h9a3 3 0 003-3v-7.5z" opacity={0.5}/></svg>;
const TerminalIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 3A.75.75 0 001.5 3.75v16.5c0 .414.336.75.75.75h19.5A.75.75 0 0022.5 20.25V3.75A.75.75 0 0021.75 3H2.25zM6.22 8.72a.75.75 0 00-1.06 1.06l2.22 2.22-2.22 2.22a.75.75 0 101.06 1.06L8.31 12l-2.09-2.06-1.12-1.22zM11.25 15.75a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5z" clipRule="evenodd" /></svg>;
const NotesIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M5.625 1.5A3.375 3.375 0 002.25 4.875v14.25A3.375 3.375 0 005.625 22.5h12.75A3.375 3.375 0 0021.75 19.125V7.5A3.375 3.375 0 0018.375 4.125H5.625zM12 18a.75.75 0 000-1.5H7.5a.75.75 0 000 1.5H12zm3-4.5a.75.75 0 000-1.5H7.5a.75.75 0 000 1.5h7.5z" clipRule="evenodd" /></svg>;
const SettingsIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.946 1.55l-.26 1.039a5.25 5.25 0 00-2.033.91.5.5 0 00-.414.536l.209 1.156a5.25 5.25 0 00-1.513 2.474.5.5 0 00.536.414l1.156-.209a5.25 5.25 0 00.91 2.033l-1.04.261a.5.5 0 00-.536.414 5.25 5.25 0 002.474 1.513l.209-1.156a.5.5 0 00-.414-.536 5.25 5.25 0 00-2.033-.91l1.04-.26a.5.5 0 00.536-.414 5.25 5.25 0 001.513-2.474l1.156.209a.5.5 0 00.414-.536 5.25 5.25 0 00-.91-2.033l.261-1.04a.5.5 0 00-.414-.536 5.25 5.25 0 00-2.474-1.513l-1.156.209a.5.5 0 00-.536-.414 5.25 5.25 0 00-2.033.91l-.26-1.04a1.99 1.99 0 00-1.551-1.946zM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /></svg>;
const OrionIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h6a.75.75 0 000-1.5h-5.25V6z" clipRule="evenodd" /></svg>;
const TextEditIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M5.25 3A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25zM8.25 6.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zM8.25 11.25h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zM8.25 15.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 010-1.5z" /></svg>;
const StarlightIDEDevIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M8.25 3.75H6a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75h-2.25V1.5a.75.75 0 00-1.5 0V3.75H9.75V1.5a.75.75 0 00-1.5 0V3.75zM9.06 12.22a.75.75 0 01.037 1.06l-2.5 2.5a.75.75 0 01-1.06-1.06l2.5-2.5a.75.75 0 011.023 0zm5.882-1.06a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const StarPlayerIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>;
const StarOSAgentIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>

export const APPS: AppConfig[] = [
    { id: 'staros-agent', name: 'StarOS Agent', Icon: StarOSAgentIcon, component: StarOSAgent, isPinned: true, allowMultipleInstances: false },
    { id: 'finder', name: 'Stardrive', Icon: FolderIcon, component: Stardrive, isPinned: true },
    { id: 'terminal', name: 'Terminal', Icon: TerminalIcon, component: Terminal, isPinned: true },
    { id: 'notes', name: 'Notes', Icon: NotesIcon, component: Notes, isPinned: true },
    { id: 'orion', name: 'Orion Browser', Icon: OrionIcon, component: Orion, isPinned: true },
    { id: 'settings', name: 'Settings', Icon: SettingsIcon, component: Settings, isPinned: true },
    { id: 'textedit', name: 'TextEdit', Icon: TextEditIcon, component: TextEdit, isPinned: false },
    { id: 'starlight-ide', name: 'Starlight IDE', Icon: StarlightIDEDevIcon, component: StarlightIDE, isPinned: false },
    { id: 'star-player', name: 'Star Player', Icon: StarPlayerIcon, component: StarPlayer, isPinned: false },
];

export const THEMES: ThemeColors[] = [
    { name: 'Stardust', main: '#6366f1', light: '#818cf8', dark: '#4f46e5', shadow: '#4338ca80' },
    { name: 'Nebula', main: '#ec4899', light: '#f472b6', dark: '#db2777', shadow: '#be185d80' },
    { name: 'Supernova', main: '#f59e0b', light: '#fbbf24', dark: '#d97706', shadow: '#b4530980' },
    { name: 'Galaxy', main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', shadow: '#6d28d980' },
    { name: 'Cosmic', main: '#10b981', light: '#34d399', dark: '#059669', shadow: '#04785780' },
    { name: 'Quasar', main: '#ef4444', light: '#f87171', dark: '#dc2626', shadow: '#b91c1c80' },
];

const STAR_APP_EXAMPLE = `import React from 'react';

// StarScript applications are React components.
// The default export is rendered by the OS.
export default function HelloWorldApp() {
    const [count, setCount] = React.useState(0);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'cyan',
            background: 'linear-gradient(45deg, #232526, #414345)',
            gap: '1rem',
            fontFamily: 'sans-serif'
        }}>
            <h1>Hello from StarScript!</h1>
            <p>You clicked {count} times</p>
            <button 
                style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#6366f1', 
                    color: 'white', 
                    cursor: 'pointer' 
                }}
                onClick={() => setCount(c => c + 1)}
            >
                Click me
            </button>
        </div>
    );
}`;

export const INITIAL_VFS: FSNode = {
    type: 'folder',
    name: '~',
    content: [
        {
            type: 'folder', name: 'home', content: [
                {
                    type: 'folder', name: 'guest', content: [
                        { type: 'folder', name: 'Desktop', content: [] },
                        { type: 'folder', name: 'Documents', content: [
                            { type: 'file', name: 'project-notes.txt', content: 'StarOS project details...' },
                            { type: 'file', name: 'hello-world.star', content: STAR_APP_EXAMPLE }
                        ]},
                        { type: 'folder', name: 'Downloads', content: [] },
                        { type: 'file', name: 'welcome.txt', content: 'Welcome to StarOS!' },
                    ]
                }
            ]
        },
        {
            type: 'folder', name: 'sys', content: [
                { type: 'file', name: 'kernel.bin', content: 'binary_data' },
            ]
        },
        {
            type: 'folder', name: 'bin', content: [
                { type: 'file', name: 'ls', content: 'executable' },
                { type: 'file', name: 'cat', content: 'executable' },
            ]
        }
    ]
};

export const get_node_by_path = (root: FSNode, path: string[]): FSNode | null => {
    let currentNode: FSNode | null = root;
    for (const part of path) {
        if (currentNode && currentNode.type === 'folder' && Array.isArray(currentNode.content)) {
            const nextNode = currentNode.content.find(node => node.name === part);
            currentNode = nextNode || null;
        } else {
            return null;
        }
    }
    return currentNode;
};