import React, { useState, useEffect } from 'react';
// FIX: Import MenuConfig to be used for type annotation.
import { AppConfig, MenuConfig } from '../types';
import Menu from './Menu';

interface MenuBarProps {
    activeApp?: AppConfig;
}

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.596 2.882c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" />
    </svg>
);


export default function MenuBar({ activeApp }: MenuBarProps) {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateClock = () => {
             setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // FIX: Add explicit type annotation to ensure `items` array conforms to `MenuItem[]` and `isSeparator: true` is not inferred as `isSeparator: boolean`.
    const starOSMenu: MenuConfig & { Icon: React.FC } = {
        name: 'StarOS',
        Icon: StarIcon,
        items: [
            { label: `About ${activeApp?.name || 'StarOS'}`},
            { isSeparator: true },
            { label: 'System Settings...' },
            { isSeparator: true },
            { label: 'Log Out Guest...' }
        ]
    };
    
    return (
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-xl text-white text-sm flex items-center justify-between px-2 z-50 border-b border-white/10"
             onMouseDown={(e) => e.stopPropagation()} // Prevent window drag from menu bar
        >
            <div className="flex items-center space-x-2">
                <Menu config={starOSMenu} />
                {activeApp && <span className="font-bold">{activeApp.name}</span>}
                {activeApp?.menus?.map(menu => <Menu key={menu.name} config={menu} />)}
            </div>
            <div className="flex items-center text-xs">
                <span className="mr-3">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span>{currentTime}</span>
            </div>
        </div>
    );
}