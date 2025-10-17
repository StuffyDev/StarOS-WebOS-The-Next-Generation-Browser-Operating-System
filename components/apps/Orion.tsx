import React, { useState, useRef } from 'react';

export default function Orion() {
    const [url, setUrl] = useState('https://duckduckgo.com/?kae=d&k1=-1&k18=-1&k21=-1&kk=-1&kav=1&kax=-1&k19=-1&ko=-1&k=1&ia=web&iaxm=maps&iax=1');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = (e.currentTarget.elements.namedItem('urlInput') as HTMLInputElement);
        let targetUrl = input.value.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        setUrl(targetUrl);
    };

    const handleRefresh = () => {
        if (iframeRef.current) {
            iframeRef.current.src = iframeRef.current.src;
        }
    };

    return (
        <div className="w-full h-full bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 h-14 flex items-center p-2 bg-slate-800/50 border-b border-white/10">
                <button onClick={handleRefresh} className="p-2 mr-2 rounded-full bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a5.002 5.002 0 008.057 4.288 1 1 0 11.586 1.908A7.002 7.002 0 013.492 9.01 1 1 0 115.008 11.057z" clipRule="evenodd" />
                    </svg>
                </button>
                <form onSubmit={handleUrlSubmit} className="flex-grow">
                    <input
                        type="text"
                        name="urlInput"
                        defaultValue={url}
                        className="w-full bg-slate-700/80 rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        placeholder="Search or enter address"
                    />
                </form>
            </div>

            {/* Content */}
            <div className="flex-grow bg-white">
                <iframe
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full border-none"
                    title="Orion Browser"
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                />
            </div>
        </div>
    );
}