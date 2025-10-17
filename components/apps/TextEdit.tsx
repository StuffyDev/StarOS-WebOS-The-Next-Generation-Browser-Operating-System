import React, { useState, useEffect } from 'react';
import { FSNode } from '../../types';
import { get_node_by_path } from '../../constants';

interface TextEditProps {
    fs?: FSNode;
    filePath?: string[];
}

export default function TextEdit({ fs, filePath }: TextEditProps) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (filePath && fs) {
            const node = get_node_by_path(fs, filePath);
            if (node && node.type === 'file') {
                setContent(node.content as string);
            } else {
                setContent(`Error: Could not find file at /${filePath.join('/')}`);
            }
        } else {
            setContent(''); // Default content for a new file
        }
        setIsLoading(false);
    }, [fs, filePath]);

    if (isLoading) {
        return <div className="w-full h-full bg-slate-800 text-white p-4">Loading file...</div>
    }

    return (
        <div className="w-full h-full bg-white text-black">
            <textarea
                className="w-full h-full bg-transparent border-none outline-none resize-none p-4 font-mono text-base"
                placeholder="Start typing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck="false"
            />
        </div>
    );
}
