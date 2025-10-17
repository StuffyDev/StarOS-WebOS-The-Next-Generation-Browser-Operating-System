import React, { useEffect, useRef, useCallback } from 'react';
import { produce } from "https://esm.sh/immer@10.1.1";
import { FSNode } from '../../types';
import { get_node_by_path } from '../../constants';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

interface TerminalProps {
    isActive: boolean;
    fs?: FSNode;
    setFs?: React.Dispatch<React.SetStateAction<FSNode>>;
}

const HOME_DIR = ['home', 'guest'];

export default function Terminal({ isActive, fs, setFs }: TerminalProps) {
    const termRef = useRef<HTMLDivElement>(null);
    const xterm = useRef<Xterm | null>(null);
    const fitAddon = useRef(new FitAddon());
    const commandLine = useRef('');
    const currentPath = useRef<string[]>(HOME_DIR);
    
    const getPathString = (path: string[]) => {
        if (path.join('/') === HOME_DIR.join('/')) return '~';
        return `/${path.join('/')}`;
    };
    
    const prompt = () => `\r\n\x1b[1;32mguest@staros\x1b[0m:\x1b[1;34m${getPathString(currentPath.current)}\x1b[0m$ `;

    const writePrompt = useCallback(() => {
        commandLine.current = '';
        xterm.current?.write(prompt());
    }, []);

    const clearLine = useCallback(() => {
        const commandLength = commandLine.current.length;
        const promptLength = prompt().length - 2; // Remove \r\n
        const totalLength = commandLength + promptLength;
        const numRows = Math.ceil(totalLength / (xterm.current?.cols || 80));
        
        for (let i = 0; i < numRows; i++) {
            xterm.current?.write('\x1b[2K\r'); // Clear line and carriage return
            if (i < numRows - 1) {
                xterm.current?.write('\x1b[1A'); // Move up one line
            }
        }
    }, []);

    const processCommand = useCallback((fullCommand: string) => {
        if (!xterm.current || !fs || !setFs) return;
        const term = xterm.current;
        
        let output: string | string[] = '';
        term.writeln('');

        if (fullCommand) {
            let hasSudo = false;
            let commandParts = fullCommand.split(' ').filter(p => p);
            if(commandParts[0]?.toLowerCase() === 'sudo') {
                hasSudo = true;
                commandParts.shift();
            }
            const [cmd, ...args] = commandParts;

            const isProtected = (path: string[]) => path.length > 0 && (path[0] === 'sys' || path[0] === 'bin');

            const resolvePath = (target: string): string[] => {
                if (target.startsWith('/')) {
                    return target.substring(1).split('/').filter(p => p);
                }
                const path = [...currentPath.current];
                target.split('/').forEach(part => {
                    if (part === '..') {
                        if (path.length > 0) path.pop();
                    } else if (part !== '.' && part !== '') {
                        path.push(part);
                    }
                });
                return path;
            };

            switch (cmd?.toLowerCase()) {
                case 'help': output = [
                        'Available commands:',
                        '  help              - Show this help message',
                        '  date              - Display the current date and time',
                        '  clear             - Clear the terminal screen',
                        '  echo [text]       - Display a line of text',
                        '  whoami            - Print the user name',
                        '  ls [path]         - List directory contents',
                        '  cd [dir]          - Change the current directory',
                        '  cat [file]        - Concatenate and display files',
                        '  mkdir [dir]       - Make directories',
                        '  touch [file]      - Create an empty file',
                        '  rm [file/dir]     - Remove files or directories (-r for recursive)',
                        '  sudo [command]    - Execute a command with superuser privileges',
                    ]; break;
                case 'date': output = new Date().toString(); break;
                case 'clear': term.clear(); writePrompt(); return;
                case 'whoami': output = 'guest'; break;
                case 'ls': {
                    const targetPath = args[0] ? resolvePath(args[0]) : currentPath.current;
                    const node = get_node_by_path(fs, targetPath);
                    if (node && node.type === 'folder' && Array.isArray(node.content)) {
                        output = node.content.map(n => `\x1b[${n.type === 'folder' ? '1;34m' : '0m'}${n.name}\x1b[0m`).join('  ');
                    } else if (node && node.type === 'file') {
                        output = node.name;
                    } else {
                        output = `ls: cannot access '${args[0] || getPathString(currentPath.current)}': No such file or directory`;
                    }
                    break;
                }
                case 'cd': {
                    const target = args[0] || '';
                    if (!target || target === '~' || target === '~/') {
                        currentPath.current = HOME_DIR;
                    } else {
                        const newPath = resolvePath(target);
                        const node = get_node_by_path(fs, newPath);
                        if (node && node.type === 'folder') {
                            currentPath.current = newPath;
                        } else {
                            output = `cd: ${target}: No such file or directory`;
                        }
                    }
                    break;
                }
                case 'cat': {
                    if (!args[0]) {
                        output = 'cat: missing file operand';
                    } else {
                        const targetPath = resolvePath(args[0]);
                        const node = get_node_by_path(fs, targetPath);
                        if (node && node.type === 'file') {
                            output = node.content as string || '';
                        } else if (node && node.type === 'folder') {
                            output = `cat: ${args[0]}: Is a directory`;
                        } else {
                            output = `cat: ${args[0]}: No such file or directory`;
                        }
                    }
                    break;
                }
                case 'mkdir':
                case 'touch': {
                     if (!args[0]) {
                        output = `${cmd}: missing operand`;
                    } else {
                        const newFileName = args[0].split('/').pop() || '';
                        const parentPath = resolvePath(args[0].substring(0, args[0].lastIndexOf('/') || args[0].length));
                        
                        if (isProtected(parentPath) && !hasSudo) {
                            output = `${cmd}: cannot create ${cmd === 'mkdir' ? 'directory' : 'file'} ‘${args[0]}’: Permission denied`;
                            break;
                        }

                        let alreadyExists = false;
                        setFs(produce(draft => {
                            const parent = get_node_by_path(draft, parentPath);
                            if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
                                if (parent.content.find(n => n.name === newFileName)) {
                                    alreadyExists = true;
                                } else {
                                    parent.content.push(cmd === 'mkdir' ? { type: 'folder', name: newFileName, content: [] } : { type: 'file', name: newFileName, content: '' });
                                }
                            } else {
                                output = `${cmd}: cannot create ${cmd === 'mkdir' ? 'directory' : 'file'} ‘${args[0]}’: No such file or directory`;
                            }
                        }));
                        if (alreadyExists) output = `${cmd}: cannot create ${cmd === 'mkdir' ? 'directory' : 'file'} ‘${args[0]}’: File exists`;
                    }
                    break;
                }
                 case 'rm': {
                    if (!args[0]) {
                        output = 'rm: missing operand';
                    } else {
                        const recursive = args[0] === '-r' || args[1] === '-r';
                        const targetName = recursive ? args[1] : args[0];
                        if (!targetName) { output = 'rm: missing operand'; break; }
                        
                        const targetPath = resolvePath(targetName);

                        if (isProtected(targetPath.slice(0, -1)) && !hasSudo) {
                            output = `rm: cannot remove ‘${targetName}’: Permission denied`;
                            break;
                        }

                        setFs(produce(draft => {
                            const parentPath = targetPath.slice(0, -1);
                            const nodeName = targetPath[targetPath.length - 1];
                            const parent = get_node_by_path(draft, parentPath);

                            if (parent && parent.type === 'folder' && Array.isArray(parent.content)) {
                                const nodeIndex = parent.content.findIndex(n => n.name === nodeName);
                                if (nodeIndex > -1) {
                                    const nodeToRemove = parent.content[nodeIndex];
                                    if (nodeToRemove.type === 'folder' && Array.isArray(nodeToRemove.content) && nodeToRemove.content.length > 0 && !recursive) {
                                        output = `rm: cannot remove '${targetName}': Is a directory`;
                                    } else {
                                        parent.content.splice(nodeIndex, 1);
                                    }
                                } else {
                                    output = `rm: cannot remove '${targetName}': No such file or directory`;
                                }
                            } else {
                                output = `rm: cannot remove '${targetName}': No such file or directory`;
                            }
                        }));
                    }
                    break;
                 }
                case 'echo': output = args.join(' '); break;
                default: output = `command not found: ${cmd}`;
            }
        }
        
        if (Array.isArray(output)) {
            output.forEach(line => term.writeln(line));
        } else if (output) {
            term.writeln(output);
        }
        writePrompt();
    }, [fs, setFs, writePrompt]);


    useEffect(() => {
        if (!termRef.current || xterm.current) return;

        const term = new Xterm({
            cursorBlink: true,
            fontFamily: 'monospace',
            fontSize: 14,
            theme: {
                background: '#00000000',
                foreground: '#4ade80',
                cursor: '#4ade80',
            },
            allowTransparency: true,
        });

        xterm.current = term;
        term.loadAddon(fitAddon.current);
        term.open(termRef.current);
        fitAddon.current.fit();

        term.writeln('StarOS Terminal [Version 1.3.0]');
        term.writeln('(c) StarOS Corporation. All rights reserved.');
        writePrompt();

        term.onKey(({ key, domEvent }) => {
            const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
            
            if (domEvent.key === 'Enter') {
                processCommand(commandLine.current);
            } else if (domEvent.key === 'Backspace') {
                if (commandLine.current.length > 0) {
                    term.write('\b \b');
                    commandLine.current = commandLine.current.slice(0, -1);
                }
            } else if (domEvent.key === 'c' && domEvent.ctrlKey) {
                writePrompt();
            }
            else if (printable && key.length === 1) { // Check if it's a single character
                commandLine.current += key;
                term.write(key);
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            fitAddon.current.fit();
        });
        if (termRef.current.parentElement) {
            resizeObserver.observe(termRef.current.parentElement);
        }
        
        return () => {
            resizeObserver.disconnect();
            term.dispose();
            xterm.current = null;
        }

    }, [processCommand, writePrompt]);

    useEffect(() => {
        if (isActive) {
            xterm.current?.focus();
        }
    }, [isActive]);

    return (
        <div 
            className="w-full h-full bg-black/80 p-2" 
            onClick={() => xterm.current?.focus()}
        >
          <div ref={termRef} className="w-full h-full" />
        </div>
      );
}
