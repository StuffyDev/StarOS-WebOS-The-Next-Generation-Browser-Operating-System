import React, { useState } from 'react';
import { produce } from "https://esm.sh/immer@10.1.1";
import { FSNode, ContextMenuItem } from '../../types';
import { get_node_by_path } from '../../constants';

const FolderIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-12 w-12 ${className || 'text-[var(--accent-color-light)]'}`}>
    <path d="M19.5 21a3 3 0 003-3v-7.5a3 3 0 00-3-3h-9a3 3 0 00-3 3v7.5a3 3 0 003 3h9z" />
    <path d="M16.5 7.5a3 3 0 00-3-3h-9a3 3 0 00-3 3v7.5a3 3 0 003 3h9a3 3 0 003-3v-7.5z" opacity={0.5}/>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

interface StardriveProps {
    fs?: FSNode;
    setFs?: React.Dispatch<React.SetStateAction<FSNode>>;
    openApp?: (appId: string, options?: { filePath?: string[] }) => void;
    showContextMenu?: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
}

const SidebarLink = ({ icon, label, path, currentPath, onClick }: { icon: React.ReactNode, label: string, path: string[], currentPath: string[], onClick: (path: string[]) => void }) => {
    const isActive = currentPath.join('/') === path.join('/');
    return (
        <button 
            onClick={() => onClick(path)}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/10 text-gray-300'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

// Main Component
export default function Stardrive({ fs, setFs, openApp, showContextMenu }: StardriveProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(['home', 'guest']);
  const [renamingNode, setRenamingNode] = useState<string | null>(null);

  if (!fs || !setFs) {
    return <div className="p-4 text-white">Loading filesystem...</div>
  }
  
  const currentNode = get_node_by_path(fs, currentPath);

  const handleDoubleClick = (node: FSNode) => {
    if (node.type === 'folder') {
        const targetNode = get_node_by_path(fs, [...currentPath, node.name]);
        if (targetNode && targetNode.type === 'folder') {
            setCurrentPath(prev => [...prev, node.name]);
        }
    } else if (node.type === 'file') {
        if (node.name.endsWith('.txt')) {
            openApp?.('textedit', { filePath: [...currentPath, node.name] });
        } else if (node.name.endsWith('.star')) {
            openApp?.('star-player', { filePath: [...currentPath, node.name] });
        }
    }
  };

  const navigateBack = () => {
      if (currentPath.length > 0) {
          setCurrentPath(prev => prev.slice(0, -1));
      }
  }

  const navigateBreadcrumb = (index: number) => {
    if (index === -1) {
        setCurrentPath([]);
    } else {
        setCurrentPath(prev => prev.slice(0, index + 1));
    }
  }

  const createNewFolder = () => {
    setFs(produce(draft => {
        const parent = get_node_by_path(draft, currentPath);
        if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
            let folderName = 'Untitled Folder';
            let counter = 2;
            while (parent.content.some(node => node.name === folderName)) {
                folderName = `Untitled Folder ${counter}`;
                counter++;
            }
            parent.content.push({ type: 'folder', name: folderName, content: [] });
        }
    }));
  };
  
  const deleteNode = (nodeName: string) => {
    setFs(produce(draft => {
        const parent = get_node_by_path(draft, currentPath);
        if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
            const nodeIndex = parent.content.findIndex(n => n.name === nodeName);
            if (nodeIndex > -1) {
                parent.content.splice(nodeIndex, 1);
            }
        }
    }));
  };

  const handleRename = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>, oldName: string) => {
      if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
      const newName = (e.target as HTMLInputElement).value.trim();
      setRenamingNode(null);
      if (newName && newName !== oldName) {
           setFs(produce(draft => {
                const parent = get_node_by_path(draft, currentPath);
                if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
                    if (parent.content.some(n => n.name === newName)) {
                        // Handle name conflict, maybe alert user or revert
                        return;
                    }
                    const node = parent.content.find(n => n.name === oldName);
                    if (node) {
                        node.name = newName;
                    }
                }
            }));
      }
  };


  const handleContextMenu = (e: React.MouseEvent, node?: FSNode) => {
      if (!showContextMenu) return;
      
      let items: ContextMenuItem[];
      if (node) {
        const filePath = [...currentPath, node.name];
        if (node.name.endsWith('.star')) {
            items = [
                { label: 'Run', action: () => openApp?.('star-player', { filePath }) },
                { label: 'Edit in Starlight IDE', action: () => openApp?.('starlight-ide', { filePath }) },
                { isSeparator: true, label: '', action: () => {} },
                { label: 'Rename', action: () => setRenamingNode(node.name) },
                { label: 'Delete', action: () => deleteNode(node.name) },
            ];
        } else {
            items = [
                { label: 'Open', action: () => handleDoubleClick(node) },
                { isSeparator: true, label: '', action: () => {} },
                { label: 'Rename', action: () => setRenamingNode(node.name) },
                { label: 'Delete', action: () => deleteNode(node.name) },
            ];
        }
      } else {
        items = [
            { label: 'New Folder', action: createNewFolder },
        ];
      }
      showContextMenu(e, items);
  };
  
  const sidebarLinks = [
      { label: "Home", path: ['home', 'guest'], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg> },
      { label: "Desktop", path: ['home', 'guest', 'Desktop'], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm1.5 0a.5.5 0 01.5-.5h10a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V5z" clipRule="evenodd" /></svg> },
      { label: "Documents", path: ['home', 'guest', 'Documents'], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9z" /><path d="M4 12a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" /></svg> },
      { label: "Downloads", path: ['home', 'guest', 'Downloads'], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg> },
  ];

  return (
    <div className="w-full h-full bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 h-full bg-slate-800/60 flex-shrink-0 p-3 border-r border-white/10 flex flex-col gap-1">
          {sidebarLinks.map(link => (
              <SidebarLink 
                  key={link.label}
                  {...link}
                  currentPath={currentPath}
                  onClick={setCurrentPath}
              />
          ))}
      </aside>

      <main className="flex-grow flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 h-14 flex items-center p-2 bg-slate-800/50 border-b border-white/10">
            <button onClick={navigateBack} disabled={currentPath.length === 0} className="px-3 py-1.5 mr-2 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="flex items-center text-sm">
                <button onClick={() => navigateBreadcrumb(-1)} className="hover:underline">~</button>
                {currentPath.map((part, i) => (
                    <React.Fragment key={i}>
                        <span className="mx-1 text-gray-500">/</span>
                        <button onClick={() => navigateBreadcrumb(i)} className="hover:underline">{part}</button>
                    </React.Fragment>
                ))}
            </div>
          </div>

          {/* Main Content */}
          <div id="finder-background" className="flex-grow p-4 overflow-y-auto" onContextMenu={(e) => {
              if((e.target as HTMLElement).id === 'finder-background') handleContextMenu(e)
          }}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {currentNode && currentNode.type === 'folder' && Array.isArray(currentNode.content) && currentNode.content.map(node => (
                <div 
                    key={node.name} 
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                    onDoubleClick={() => handleDoubleClick(node)}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                >
                  {node.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                  {renamingNode === node.name ? (
                      <input
                        type="text"
                        defaultValue={node.name}
                        className="mt-2 text-xs text-center bg-slate-700 border border-white/20 rounded-sm outline-none w-full"
                        autoFocus
                        onBlur={(e) => handleRename(e, node.name)}
                        onKeyDown={(e) => handleRename(e, node.name)}
                        onClick={(e) => e.stopPropagation()}
                      />
                  ) : (
                    <span className="mt-2 text-xs text-center break-all w-full">{node.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
      </main>
    </div>
  );
}