import React from 'react';
import { WindowConfig } from '../types';
import useDraggable from '../hooks/useDraggable';

interface WindowProps {
    config: WindowConfig;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    onFocus: () => void;
    onPositionChange: (position: { x: number; y: number }) => void;
    onSizeChange: (size: { width: number; height: number }) => void;
    isActive: boolean;
    children: React.ReactNode;
    effectsEnabled: boolean;
}

const WindowControls = ({ onClose, onMinimize, onMaximize }: { onClose: () => void; onMinimize: () => void; onMaximize: () => void; }) => (
    <div className="flex items-center space-x-2">
        <button onClick={onClose} className="w-3.5 h-3.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"></button>
        <button onClick={onMinimize} className="w-3.5 h-3.5 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors"></button>
        <button onClick={onMaximize} className="w-3.5 h-3.5 bg-green-500 rounded-full hover:bg-green-600 transition-colors"></button>
    </div>
);

export default function Window({
    config,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onPositionChange,
    onSizeChange,
    isActive,
    children,
    effectsEnabled
}: WindowProps) {
    const { ref: dragRef, position } = useDraggable({
        initialPosition: config.position,
        onDrag: onPositionChange,
        onDragStart: onFocus,
        disabled: config.isMaximized
    });

    const windowClasses = [
        "absolute flex flex-col overflow-hidden border border-white/10",
        effectsEnabled ? "bg-slate-800/70 backdrop-blur-2xl" : "bg-slate-800/95",
        "transition-all duration-300 ease-in-out",
        config.isMaximized 
            ? "top-8 left-0 right-0 bottom-0 rounded-none" 
            : "rounded-lg shadow-2xl",
        config.isMinimized ? "hidden" : "opacity-100",
    ].join(" ");

    const activeStyle = isActive ? {
      boxShadow: `0 0 25px 0px var(--accent-shadow-color)`
    } : {};
    
    return (
        <div
            className={windowClasses}
            style={{
                zIndex: config.zIndex,
                ...(!config.isMaximized && {
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  width: config.size.width,
                  height: config.size.height,
                }),
                ...activeStyle,
            }}
            onMouseDown={onFocus}
        >
            <header ref={dragRef} className="h-9 px-4 flex items-center justify-between bg-black/20 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <WindowControls onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} />
                <span className="text-white text-sm font-medium truncate">{config.title}</span>
                <div className="w-14"></div> {/* Spacer */}
            </header>
            <div className="flex-grow w-full h-full overflow-auto">
                {children}
            </div>
        </div>
    );
}