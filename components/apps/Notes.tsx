import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  content: string;
}

const initialNotes: Note[] = [
  {
    id: `note-${Date.now()}`,
    content: `Welcome to StarOS Notes!
This is a simple notes application where you can jot down your thoughts.

- Create new notes with the '+' button.
- Delete notes with the 'x' button.
- Enjoy the cosmic theme!
- Try opening multiple apps.
- Customize your wallpaper in Settings.`
  }
];

const getTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.length > 0 ? firstLine : 'New Note';
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);

  useEffect(() => {
    if (notes.length > 0 && !notes.find(n => n.id === activeNoteId)) {
        setActiveNoteId(notes[0].id);
    } else if (notes.length === 0) {
        setActiveNoteId(null);
    }
  }, [notes, activeNoteId]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: 'New Note\n'
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(prev => prev.map(note => 
      note.id === activeNoteId ? { ...note, content: e.target.value } : note
    ));
  };

  const activeNote = notes.find(note => note.id === activeNoteId);

  return (
    <div className="w-full h-full bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-1/3 max-w-xs h-full bg-slate-800/50 border-r border-white/10 flex flex-col">
        <div className="p-2 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold px-2">All Notes</h2>
            <button onClick={handleCreateNote} className="p-2 rounded-md hover:bg-white/10 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            </button>
        </div>
        <div className="overflow-y-auto flex-grow">
            {notes.map(note => (
                <div 
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-3 cursor-pointer border-l-4 group flex justify-between items-center ${activeNoteId === note.id ? 'bg-[var(--accent-color)] border-[var(--accent-color-light)]' : 'border-transparent hover:bg-white/5'}`}
                >
                    <span className="truncate pr-2">{getTitle(note.content)}</span>
                    <button onClick={(e) => handleDeleteNote(e, note.id)} className="p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/50 hover:text-white">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
      </div>
      {/* Editor */}
      <div className="flex-grow h-full">
        {activeNote ? (
            <textarea
                key={activeNote.id}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-200 placeholder-gray-500 p-6"
                placeholder="Start typing..."
                value={activeNote.content}
                onChange={handleNoteChange}
            />
        ) : (
            <div className="w-full h-full flex flex-col justify-center items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl">Select a note or create a new one</h3>
            </div>
        )}
      </div>
    </div>
  );
}