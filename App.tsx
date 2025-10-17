import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WindowConfig, AppConfig, Theme, FSNode, ContextMenuState, ContextMenuItem, SystemAgentProps } from './types';
import { APPS, THEMES, INITIAL_VFS } from './constants';
import Desktop from './components/Desktop';
import Dock from './components/Dock';
import MenuBar from './components/MenuBar';
import ContextMenu from './components/ContextMenu';

const wallpapers = [
    'https://images.unsplash.com/photo-1534447677768-be436a0979f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2094&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1506280432243-a639995275a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80',
];

export default function App() {
    const [windows, setWindows] = useState<WindowConfig[]>([]);
    const [nextZIndex, setNextZIndex] = useState(10);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [wallpaper, setWallpaper] = useState(wallpapers[4]);
    const [theme, setThemeState] = useState<Theme>({
        colors: THEMES[0],
        effects: true,
    });
    const [fs, setFs] = useState<FSNode>(INITIAL_VFS);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const hasMaximizedWindow = useMemo(() => windows.some(w => w.isMaximized), [windows]);
    const [isDockVisible, setDockVisible] = useState(true);
    const [dockHover, setDockHover] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', theme.colors.main);
        root.style.setProperty('--accent-color-light', theme.colors.light);
        root.style.setProperty('--accent-color-dark', theme.colors.dark);
        root.style.setProperty('--accent-shadow-color', theme.colors.shadow);
        
        const handleGlobalClick = () => setContextMenu(null);
        const handleGlobalContextMenu = (e: MouseEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            e.preventDefault();
            setContextMenu(null);
        };
        
        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('contextmenu', handleGlobalContextMenu);
        
        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('contextmenu', handleGlobalContextMenu);
        };

    }, [theme.colors]);

    useEffect(() => {
        if (hasMaximizedWindow) {
             const timer = setTimeout(() => {
                if(!dockHover) setDockVisible(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setDockVisible(true);
        }
    }, [hasMaximizedWindow, dockHover]);


    const setTheme = useCallback((newTheme: Partial<Theme>) => {
        setThemeState(prev => ({...prev, ...newTheme}));
    }, []);

    const openApp = useCallback((appOrId: AppConfig | string, options?: { filePath?: string[] }) => {
        const app = typeof appOrId === 'string' ? APPS.find(a => a.id === appOrId) : appOrId;
        if (!app) return;

        // Prevent opening multiple instances of certain apps like the Agent
        if (!app.allowMultipleInstances) {
            const existingWindow = windows.find(w => w.appId === app.id);
            if (existingWindow) {
                focusWindow(existingWindow.id);
                return;
            }
        }

        const newWindowId = `${app.id}-${Date.now()}`;
        
        const newWindow: WindowConfig = {
            id: newWindowId,
            appId: app.id,
            title: app.name,
            position: { x: Math.random() * 200 + 150, y: Math.random() * 100 + 100 },
            size: { width: 720, height: 540 },
            zIndex: nextZIndex,
            isMinimized: false,
            isMaximized: false,
            filePath: options?.filePath,
        };
        
        setWindows(prev => [...prev, newWindow]);
        setNextZIndex(prev => prev + 1);
        setActiveWindowId(newWindowId);
    }, [nextZIndex, windows]);

    const focusWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(win => 
            win.id === id ? { ...win, zIndex: nextZIndex } : win
        ));
        setNextZIndex(prev => prev + 1);
        setActiveWindowId(id);
    }, [nextZIndex]);
    
    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.filter(win => win.id !== id));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    }, [activeWindowId]);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(win => 
            win.id === id ? { ...win, isMinimized: true } : win
        ));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    }, [activeWindowId]);

    const restoreWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(win => 
            win.id === id ? { ...win, isMinimized: false } : win
        ));
        focusWindow(id);
    }, [focusWindow]);

    const toggleMaximizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(win =>
            win.id === id ? { ...win, isMaximized: !win.isMaximized } : win
        ));
        focusWindow(id);
    }, [focusWindow]);

    const updateWindowPosition = useCallback((id: string, position: { x: number, y: number }) => {
        setWindows(prev => prev.map(win => 
            win.id === id ? { ...win, position } : win
        ));
    }, []);

    const updateWindowSize = useCallback((id: string, size: { width: number, height: number }) => {
        setWindows(prev => prev.map(win => 
            win.id === id ? { ...win, size } : win
        ));
    }, []);
    
    const showContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, items });
    }, []);

    const activeApp = APPS.find(app => windows.find(w => w.id === activeWindowId)?.appId === app.id);
    
    const systemAgentProps: SystemAgentProps = {
        fs,
        setFs,
        windows,
        openApp,
        closeWindow,
    };

    return (
        <main 
            className="h-screen w-screen overflow-hidden bg-cover bg-center transition-all duration-500" 
            style={{ backgroundImage: `url(${wallpaper})` }}
        >
            <div className="absolute inset-0 bg-black/10">
                <MenuBar activeApp={activeApp} />
                <Desktop
                    windows={windows}
                    openApp={openApp}
                    closeWindow={closeWindow}
                    minimizeWindow={minimizeWindow}
                    focusWindow={focusWindow}
                    toggleMaximizeWindow={toggleMaximizeWindow}
                    updateWindowPosition={updateWindowPosition}
                    updateWindowSize={updateWindowSize}
                    activeWindowId={activeWindowId}
                    wallpapers={wallpapers}
                    setWallpaper={setWallpaper}
                    theme={theme}
                    setTheme={setTheme}
                    fs={fs}
                    setFs={setFs}
                    showContextMenu={showContextMenu}
                    systemAgentProps={systemAgentProps}
                />
                
                <div 
                    className="absolute bottom-0 left-0 w-full h-8 z-40"
                    onMouseEnter={() => {
                        if (hasMaximizedWindow) {
                            setDockVisible(true);
                            setDockHover(true);
                        }
                    }}
                    onMouseLeave={() => {
                         if (hasMaximizedWindow) {
                            setDockHover(false);
                         }
                    }}
                />

                <Dock 
                    apps={APPS} 
                    openApp={openApp} 
                    openWindows={windows} 
                    focusWindow={focusWindow}
                    restoreWindow={restoreWindow}
                    closeWindow={closeWindow}
                    showContextMenu={showContextMenu}
                    isVisible={isDockVisible}
                />
                {contextMenu && <ContextMenu {...contextMenu} close={() => setContextMenu(null)} />}
            </div>
        </main>
    );
}