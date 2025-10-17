import React from 'react';
import { AppConfig, WindowConfig, ContextMenuItem } from '../types';

interface DockProps {
    apps: AppConfig[];
    openApp: (app: AppConfig) => void;
    openWindows: WindowConfig[];
    focusWindow: (id: string) => void;
    restoreWindow: (id: string) => void;
    closeWindow: (id: string) => void;
    showContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
    isVisible: boolean;
}

const DockIcon = ({ 
    app, 
    onClick, 
    onContextMenu,
    isActive 
}: { 
    app: AppConfig, 
    onClick: () => void, 
    onContextMenu: (e: React.MouseEvent) => void,
    isActive: boolean 
}) => {
    return (
        <div className="relative group flex flex-col items-center">
            <button
                onClick={onClick}
                onContextMenu={onContextMenu}
                className="p-1.5 rounded-lg transition-all duration-200 ease-in-out transform group-hover:scale-125 group-hover:-translate-y-2 focus:outline-none"
                aria-label={`Open ${app.name}`}
            >
                <app.Icon className="w-12 h-12 text-white drop-shadow-lg" />
            </button>
            <div className="absolute -top-10 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {app.name}
            </div>
            {isActive && <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{backgroundColor: 'var(--accent-color-light)', boxShadow: '0 0 5px var(--accent-color-light)'}}></div>}
        </div>
    )
}

export default function Dock({ apps, openApp, openWindows, focusWindow, restoreWindow, closeWindow, showContextMenu, isVisible }: DockProps) {

    const handleAppClick = (app: AppConfig) => {
        const runningWindow = openWindows.find(w => w.appId === app.id);
        if (runningWindow) {
            if (runningWindow.isMinimized) {
                restoreWindow(runningWindow.id);
            } else {
                focusWindow(runningWindow.id);
            }
        } else {
            openApp(app);
        }
    };
    
    const handleContextMenu = (e: React.MouseEvent, app: AppConfig) => {
        const runningWindow = openWindows.find(w => w.appId === app.id);
        const items: ContextMenuItem[] = [
            { label: app.name, disabled: true, action: () => {} },
            { label: 'Open', action: () => handleAppClick(app) },
        ];

        if (runningWindow) {
            items.push({ label: 'Quit', action: () => closeWindow(runningWindow.id) });
        }
        
        showContextMenu(e, items);
    };

    const dockClasses = [
        "absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center items-end h-24 z-50",
        "transition-transform duration-300 ease-in-out",
        !isVisible ? "translate-y-32" : "translate-y-0"
    ].join(" ");


    return (
        <div className={dockClasses}>
            <div className="flex items-center justify-center space-x-2 bg-black/20 backdrop-blur-lg p-2 rounded-2xl border border-white/10 shadow-2xl">
                {apps.filter(app => app.isPinned).map(app => {
                    const isActive = openWindows.some(w => w.appId === app.id && !w.isMinimized);
                    return <DockIcon 
                        key={app.id} 
                        app={app} 
                        onClick={() => handleAppClick(app)}
                        onContextMenu={(e) => handleContextMenu(e, app)}
                        isActive={isActive} />
                })}
            </div>
        </div>
    );
}