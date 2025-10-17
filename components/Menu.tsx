import React, { useState, useEffect, useRef } from 'react';
import { MenuConfig } from '../types';

interface MenuProps {
  config: MenuConfig & { Icon?: React.FC };
}

export default function Menu({ config }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleItemClick = (action?: () => void) => {
    action?.();
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onMouseDown={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1 text-xs rounded transition-colors ${isOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
      >
        {config.Icon && <config.Icon />}
        {!config.Icon && config.name}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800/90 backdrop-blur-xl rounded-md shadow-lg border border-white/10 py-1 z-50">
          {config.items.map((item, index) => (
            // FIX: Use the `in` operator for type guarding a discriminated union. This correctly checks if `item` is a separator.
            'isSeparator' in item ? <div key={index} className="h-px bg-white/10 my-1" /> :
            <button 
              key={index}
              onClick={() => handleItemClick(item.action)}
              disabled={item.disabled}
              className="w-full text-left text-xs px-3 py-1.5 flex justify-between items-center hover:bg-[var(--accent-color)] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-gray-400">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}