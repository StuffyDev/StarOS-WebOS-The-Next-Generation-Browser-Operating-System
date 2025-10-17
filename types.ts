import React from 'react';

export interface ThemeColors {
    name: string;
    main: string;
    light: string;
    dark: string;
    shadow: string;
}

export interface Theme {
    colors: ThemeColors;
    effects: boolean;
}

// FIX: Changed MenuItem from an interface to a discriminated union type to correctly handle separators.
// A menu item is either a separator (with `isSeparator: true`) or a regular item with a required `label`.
export type MenuItem =
  | {
      isSeparator: true;
      label?: string; // Not used, but can be present.
      action?: () => void;
      shortcut?: string;
      disabled?: boolean;
    }
  | {
      label: string;
      action?: () => void;
      shortcut?: string;
      disabled?: boolean;
      // The `isSeparator?: false` property was removed to improve discriminated union type inference.
      // Now, the presence of `isSeparator` property is the discriminant.
    };

export interface MenuConfig {
    name: string;
    items: MenuItem[];
}

export interface SystemAgentProps {
    fs: FSNode;
    setFs: React.Dispatch<React.SetStateAction<FSNode>>;
    windows: WindowConfig[];
    openApp: (appId: string, options?: { filePath?: string[] }) => void;
    closeWindow: (id: string) => void;
}

export interface AppConfig {
    id: string;
    name: string;
    Icon: React.FC<{ className?: string }>;
    component: React.FC<{ 
        windowId: string; 
        close: () => void; 
        isActive: boolean; 
        wallpapers?: string[]; 
        setWallpaper?: (url: string) => void;
        theme?: Theme;
        setTheme?: (theme: Partial<Theme>) => void;
        fs?: FSNode;
        setFs?: React.Dispatch<React.SetStateAction<FSNode>>;
        filePath?: string[];
        openApp?: (appId: string, options?: { filePath?: string[] }) => void;
        // FIX: Add `showContextMenu` to the props type for app components to resolve TypeScript error.
        showContextMenu?: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
        systemAgentProps?: SystemAgentProps;
    }>;
    isPinned: boolean;
    menus?: MenuConfig[];
    allowMultipleInstances?: boolean;
}

export interface WindowConfig {
    id: string;
    appId: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
    filePath?: string[];
}

export type FSNode = {
  type: 'file' | 'folder';
  name: string;
  content?: string | FSNode[];
};

export interface ContextMenuItem {
    label: string;
    action: () => void;
    isSeparator?: boolean;
    disabled?: boolean;
}

export interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
}