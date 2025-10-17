import React, { useState, useEffect } from 'react';
import { FSNode } from '../../types';
import { get_node_by_path } from '../../constants';

// Let TypeScript know that the Babel object is available on the window
declare var Babel: any;

interface StarPlayerProps {
    fs?: FSNode;
    filePath?: string[];
}

export default function StarPlayer({ fs, filePath }: StarPlayerProps) {
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAndCompile = () => {
            if (!filePath || !fs) {
                setError("File path or filesystem not provided.");
                setIsLoading(false);
                return;
            }
            if (typeof Babel === 'undefined') {
                setError("Babel compiler is not loaded. Cannot run StarScript.");
                setIsLoading(false);
                return;
            }

            const node = get_node_by_path(fs, filePath);

            if (!node || node.type !== 'file' || typeof node.content !== 'string') {
                setError(`Could not find or read file: /${filePath.join('/')}`);
                setIsLoading(false);
                return;
            }

            try {
                const code = node.content;
                // Add the 'es2015' preset to handle ES modules (import/export)
                const transformedCode = Babel.transform(code, { presets: ['react', 'es2015'] }).code;
                
                const exports = {};
                const module = { exports };
                
                // Create a sandboxed 'require' function that only resolves React
                const require = (moduleName: string) => {
                    if (moduleName === 'react') {
                        return React;
                    }
                    throw new Error(`Cannot find module '${moduleName}'`);
                };

                // We pass React, module, exports, and our custom require to the scope of the evaluated code
                const componentFactory = new Function('React', 'module', 'exports', 'require', transformedCode);
                componentFactory(React, module, exports, require);
                
                // @ts-ignore
                const AppComponent = module.exports.default;

                if (typeof AppComponent === 'function' || (typeof AppComponent === 'object' && AppComponent.$$typeof === Symbol.for('react.element'))) {
                    setComponent(() => AppComponent); // Use a function to set state
                    setError(null);
                } else {
                    throw new Error("The file does not have a default React component export.");
                }

            } catch (e) {
                if (e instanceof Error) {
                    setError(`Compilation Error: ${e.message}`);
                } else {
                    setError("An unknown compilation error occurred.");
                }
                setComponent(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadAndCompile();
    }, [fs, filePath]);

    if (isLoading) {
        return <div className="w-full h-full flex justify-center items-center bg-slate-900 text-white">Loading App...</div>;
    }

    if (error) {
        return (
            <div className="w-full h-full bg-red-900/50 text-white p-4 font-mono">
                <h3 className="text-lg text-red-300 mb-2">Failed to run StarScript App</h3>
                <pre className="text-sm whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    if (Component) {
        return (
            <div className="w-full h-full">
                <Component />
            </div>
        );
    }

    return <div className="w-full h-full flex justify-center items-center bg-slate-900 text-white">App loaded but no component to display.</div>;
}