import React, { useState } from 'react';
import { produce } from "https://esm.sh/immer@10.1.1";
import { WindowConfig, AppConfig, Theme, FSNode, ContextMenuItem, SystemAgentProps } from '../types';
import Window from './Window';
import { APPS, get_node_by_path } from '../constants';

interface DesktopProps {
    windows: WindowConfig[];
    openApp: (app: AppConfig | string, options?: { filePath?: string[] }) => void;
    closeWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
    updateWindowSize: (id: string, size: { width: number; height: number }) => void;
    activeWindowId: string | null;
    wallpapers: string[];
    setWallpaper: (url: string) => void;
    theme: Theme;
    setTheme: (theme: Partial<Theme>) => void;
    fs: FSNode;
    setFs: React.Dispatch<React.SetStateAction<FSNode>>;
    showContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
    systemAgentProps: SystemAgentProps;
}

export default function Desktop({
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    focusWindow,
    toggleMaximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    activeWindowId,
    wallpapers,
    setWallpaper,
    theme,
    setTheme,
    fs,
    setFs,
    showContextMenu,
    systemAgentProps,
}: DesktopProps) {
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number, startX: number, startY: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only start selection if clicking on the desktop itself, not a window
        if ((e.target as HTMLElement).id !== 'desktop-background') return;
        
        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            x: e.clientX,
            y: e.clientY,
            width: 0,
            height: 0,
        });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            setSelectionBox(prev => {
                if (!prev) return null;
                const x = Math.min(prev.startX, moveEvent.clientX);
                const y = Math.min(prev.startY, moveEvent.clientY);
                const width = Math.abs(prev.startX - moveEvent.clientX);
                const height = Math.abs(prev.startY - moveEvent.clientY);
                return { ...prev, x, y, width, height };
            });
        };

        const handleMouseUp = () => {
            setSelectionBox(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const createNewFolder = () => {
        setFs(produce(draft => {
            const desktopPath = ['home', 'guest'];
            const desktopNode = get_node_by_path(draft, desktopPath);

            if (desktopNode && desktopNode.type === 'folder' && Array.isArray(desktopNode.content)) {
                let folderName = 'Untitled Folder';
                let counter = 2;
                while (desktopNode.content.some(node => node.name === folderName)) {
                    folderName = `Untitled Folder ${counter}`;
                    counter++;
                }
                desktopNode.content.push({
                    type: 'folder',
                    name: folderName,
                    content: []
                });
            }
        }));
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).id === 'desktop-background') {
            showContextMenu(e, [
                { label: 'New Folder', action: createNewFolder },
                { isSeparator: true, label: '', action: () => {} },
                { label: 'Change Wallpaper', action: () => openApp('settings') },
                { label: 'System Settings', action: () => openApp('settings') },
            ]);
        }
    };
    
    const appSpecificProps = {
        wallpapers,
        setWallpaper,
        theme,
        setTheme,
        fs,
        setFs,
        openApp,
        showContextMenu,
        systemAgentProps
    };

    return (
        <div 
            id="desktop-background" 
            className="h-full w-full absolute top-0 left-0" 
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        >
            {/* Render selection box */}
            {selectionBox && (
                <div
                    className="absolute border border-[var(--accent-color)] bg-[var(--accent-shadow-color)]"
                    style={{
                        left: selectionBox.x,
                        top: selectionBox.y,
                        width: selectionBox.width,
                        height: selectionBox.height,
                        zIndex: 9999
                    }}
                />
            )}
            
            {windows.map(win => {
                const app = APPS.find(a => a.id === win.appId);
                if (!app) return null;

                const AppContent = app.component;

                return (
                    <Window
                        key={win.id}
                        config={win}
                        onClose={() => closeWindow(win.id)}
                        onMinimize={() => minimizeWindow(win.id)}
                        onFocus={() => focusWindow(win.id)}
                        onMaximize={() => toggleMaximizeWindow(win.id)}
                        onPositionChange={(pos) => updateWindowPosition(win.id, pos)}
                        onSizeChange={(size) => updateWindowSize(win.id, size)}
                        isActive={activeWindowId === win.id}
                        effectsEnabled={theme.effects}
                    >
                        <AppContent
                            windowId={win.id}
                            close={() => closeWindow(win.id)}
                            isActive={activeWindowId === win.id}
                            filePath={win.filePath}
                            {...appSpecificProps}
                        />
                    </Window>
                );
            })}
        </div>
    );
}