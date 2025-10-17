import React, { useState } from 'react';
import { Theme, ThemeColors } from '../../types';
import { THEMES } from '../../constants';

interface SettingsProps {
    wallpapers?: string[];
    setWallpaper?: (url: string) => void;
    theme?: Theme;
    setTheme?: (theme: Partial<Theme>) => void;
}

const sections = [
    { id: 'appearance', name: 'Appearance', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM8.5 13a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" /></svg> },
    { id: 'wallpaper', name: 'Wallpaper', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.19l-2.2-2.2a.75.75 0 00-1.06 0l-1.94 1.94-1.48-1.48a.75.75 0 00-1.06 0l-5.02 5.02zM2.5 5.5c0-.414.336-.75.75-.75h13.5a.75.75 0 01.75.75v3.19l-3.22-3.22a.75.75 0 00-1.06 0l-3.94 3.94-1.48-1.48a.75.75 0 00-1.06 0L2.5 9.19V5.5z" clipRule="evenodd" /></svg> }
];

const SectionHeader: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        {children}
    </div>
);


const AppearanceSettings = ({ theme, setTheme }: { theme?: Theme; setTheme?: (theme: Partial<Theme>) => void; }) => (
    <>
        <h1 className="text-2xl font-bold mb-6">Appearance</h1>
        <SectionHeader title="Accent Color">
            <div className="flex flex-wrap gap-4">
                {THEMES.map((t: ThemeColors) => (
                    <div key={t.name} className="flex flex-col items-center gap-2">
                            <button
                            onClick={() => setTheme?.({ colors: t })}
                            className={`w-8 h-8 rounded-full transition-transform duration-150 ${theme?.colors.name === t.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : 'hover:scale-110'}`}
                            style={{ backgroundColor: t.main }}
                            aria-label={`Set theme to ${t.name}`}
                        />
                        <span className="text-xs text-gray-300">{t.name}</span>
                    </div>
                ))}
            </div>
        </SectionHeader>
        <SectionHeader title="Effects">
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                <h3 className="text-sm font-medium">Enable Glass Effects</h3>
                <button
                    onClick={() => setTheme?.({ effects: !theme?.effects })}
                    className={`relative w-11 h-6 rounded-full flex items-center transition-colors ${theme?.effects ? 'bg-[var(--accent-color)] justify-end' : 'bg-slate-700 justify-start'}`}
                >
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out" style={{ transform: theme?.effects ? 'translateX(20px)' : 'translateX(0px)' }}></span>
                </button>
            </div>
        </SectionHeader>
    </>
);

const WallpaperSettings = ({ wallpapers, setWallpaper }: { wallpapers: string[]; setWallpaper?: (url: string) => void; }) => (
     <>
        <h1 className="text-2xl font-bold mb-6">Desktop Wallpaper</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {wallpapers.map(url => (
                <button key={url} onClick={() => setWallpaper?.(url)} className="aspect-video rounded-md overflow-hidden ring-offset-2 ring-offset-slate-800 focus:ring-2 focus:ring-white outline-none group">
                    <img src={url} alt="Wallpaper thumbnail" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                </button>
            ))}
        </div>
    </>
);


export default function Settings({ wallpapers = [], setWallpaper, theme, setTheme }: SettingsProps) {
    const [activeSection, setActiveSection] = useState('appearance');

    return (
        <div className="w-full h-full bg-slate-900/50 text-white flex">
            <aside className="w-56 h-full bg-slate-800/60 flex-shrink-0 p-4 border-r border-white/10">
                <h1 className="text-xl font-bold mb-8 px-2">Settings</h1>
                <nav className="flex flex-col gap-1">
                    {sections.map(section => (
                        <button 
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === section.id ? 'bg-[var(--accent-color)]' : 'hover:bg-white/10'}`}
                        >
                            {section.icon}
                            <span>{section.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-grow h-full p-8 overflow-y-auto">
                {activeSection === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} />}
                {activeSection === 'wallpaper' && <WallpaperSettings wallpapers={wallpapers} setWallpaper={setWallpaper} />}
            </main>
        </div>
    );
}