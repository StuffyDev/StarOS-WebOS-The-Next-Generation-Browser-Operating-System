import React, { useEffect, useRef } from 'react';
import { ContextMenuState } from '../types';

interface ContextMenuProps extends ContextMenuState {
    close: () => void;
}

export default function ContextMenu({ x, y, items, close }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Adjust position if menu would go off-screen
    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const { innerWidth, innerHeight } = window;
            if (x + menu.offsetWidth > innerWidth) {
                menu.style.left = `${innerWidth - menu.offsetWidth - 5}px`;
            }
            if (y + menu.offsetHeight > innerHeight) {
                menu.style.top = `${innerHeight - menu.offsetHeight - 5}px`;
            }
        }
    }, [x, y]);

    const handleItemClick = (action: () => void) => {
        action();
        close();
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 py-1.5 z-[99999] w-52"
            style={{ top: y, left: x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {items.map((item, index) => (
                item.isSeparator ? (
                    <div key={index} className="h-px bg-white/10 my-1 mx-2" />
                ) : (
                    <button
                        key={index}
                        onClick={() => handleItemClick(item.action)}
                        disabled={item.disabled}
                        className="w-full text-left text-sm px-3 py-1.5 hover:bg-[var(--accent-color)] disabled:text-gray-500 disabled:hover:bg-transparent"
                    >
                        {item.label}
                    </button>
                )
            ))}
        </div>
    );
}
