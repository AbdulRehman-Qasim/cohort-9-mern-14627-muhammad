import React, { useContext, useEffect, useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import { AuthContext } from '../context/AuthContext';
import notesService from '../services/notes.service';
import { Note } from '../types/notes.types';
import { ApiError } from '../types/auth.types';
import UserProfileModal from '../components/UserProfileModal';
import NoteEditorModal from '../components/NoteEditorModal';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

type SortOrder = 'newest' | 'oldest' | 'title-az' | 'title-za';

interface ImportNoteEntry {
  title: string;
  content: string;
}

function isImportNoteEntry(value: unknown): value is ImportNoteEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['title'] === 'string' && obj['title'].trim().length > 0;
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'h1', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'rel'],
    FORCE_BODY: true,
    ADD_ATTR: ['rel'],
    FORBID_ATTR: ['style', 'class'],
  });
}

const DashboardPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [pinnedNoteIds, setPinnedNoteIds] = useState<string[]>(() => {
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`memoora_pins_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuNoteId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const togglePin = (noteId: string) => {
    setPinnedNoteIds((prev) => {
      let newPins = [...prev];
      if (newPins.includes(noteId)) {
        newPins = newPins.filter((id) => id !== noteId);
      } else {
        if (newPins.length >= 3) {
          toast.error('You can only pin up to 3 notes');
          return prev;
        }
        newPins.push(noteId);
      }
      if (user) {
        localStorage.setItem(`memoora_pins_${user.id}`, JSON.stringify(newPins));
      }
      return newPins;
    });
  };

  const displayedNotes = notes
    .filter((note) => {
      const q = searchQuery.toLowerCase();
      const plainContent = note.content.replace(/<[^>]+>/g, '').toLowerCase();
      return note.title.toLowerCase().includes(q) || plainContent.includes(q);
    })
    .sort((a, b) => {
      const aPinned = pinnedNoteIds.includes(a.id);
      const bPinned = pinnedNoteIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'title-az') return a.title.localeCompare(b.title);
      if (sortOrder === 'title-za') return b.title.localeCompare(a.title);
      return 0;
    });

  useEffect(() => {
    let isMounted = true;
    const fetchNotes = async () => {
      try {
        const response = await notesService.getNotes();
        if (isMounted) {
          if (response.success && response.data) {
            setNotes(response.data);
          } else {
            setError(response.error || 'Failed to fetch notes.');
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) setError(err.message);
          else if (err instanceof Error) setError(err.message);
          else setError('An unexpected error occurred while fetching notes.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNotes();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(apiUrl, {
      withCredentials: true,
    });

    socketRef.current.on('NOTE_CREATED', (newNote: Note) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) return prev;
        return [newNote, ...prev];
      });
    });

    socketRef.current.on('NOTE_UPDATED', (updatedNote: Note) => {
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    });

    socketRef.current.on('NOTE_DELETED', (deletedId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== deletedId));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const handleCreateNote = async (title: string, content: string) => {
    setCreateError('');
    if (!title.trim()) {
      setCreateError('Title is required.');
      return;
    }
    setIsCreating(true);
    try {
      const response = await notesService.createNote({ title: title.trim(), content: content.trim() });
      if (response.success && response.data) {
        setNotes((prev) => {
          if (prev.some((n) => n.id === response.data!.id)) return prev;
          return [response.data!, ...prev];
        });
        setIsCreateModalOpen(false);
      } else {
        setCreateError(response.error || 'Failed to create note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setCreateError(err.message);
      else if (err instanceof Error) setCreateError(err.message);
      else setCreateError('An unexpected error occurred while creating the note.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateNote = async (title: string, content: string) => {
    if (!editingNote) return;
    setEditError('');
    if (!title.trim()) {
      setEditError('Title is required.');
      return;
    }
    setIsUpdating(true);
    try {
      const response = await notesService.updateNote(editingNote.id, { title: title.trim(), content: content.trim() });
      if (response.success && response.data) {
        const updated = response.data;
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
        setEditingNote(null);
      } else {
        setEditError(response.error || 'Failed to update note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setEditError(err.message);
      else if (err instanceof Error) setEditError(err.message);
      else setEditError('An unexpected error occurred while updating the note.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete.id;
    setDeletingNoteId(id);
    setDeleteError('');
    try {
      const response = await notesService.deleteNote(id);
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      } else {
        setDeleteError(response.error || 'Failed to delete note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setDeleteError(err.message);
      else if (err instanceof Error) setDeleteError(err.message);
      else setDeleteError('An unexpected error occurred while deleting the note.');
    } finally {
      setDeletingNoteId(null);
      setNoteToDelete(null);
    }
  };

  const handleExport = () => {
    if (!notes || notes.length === 0) {
      toast.error('There are no notes available to export.');
      return;
    }

    const headers = ['Title', 'Content', 'Created At', 'Updated At'];

    const escapeCsv = (str: string) => {
      if (str === null || str === undefined) return '""';
      const strVal = String(str);
      return `"${strVal.replace(/"/g, '""')}"`;
    };

    const rows = notes.map((note) => {
      let plainContent = note.content
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();

      const txt = document.createElement('textarea');
      txt.innerHTML = plainContent;
      plainContent = txt.value;

      const createdAt = new Date(note.createdAt).toISOString().split('T')[0];
      const updatedAt = new Date(note.updatedAt).toISOString().split('T')[0];

      return [
        escapeCsv(note.title),
        escapeCsv(plainContent),
        escapeCsv(createdAt),
        escapeCsv(updatedAt)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Memoora-notes-${dateStr}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Notes exported successfully.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw: unknown = JSON.parse(event.target?.result as string);

        if (!Array.isArray(raw)) {
          alert('Invalid file format. Expected a JSON array of notes.');
          return;
        }

        const sanitizedEntries: ImportNoteEntry[] = raw
          .filter(isImportNoteEntry)
          .map((entry) => ({
            title: entry.title.trim(),
            content: typeof entry.content === 'string' ? entry.content : '',
          }));

        if (sanitizedEntries.length === 0) {
          alert('No valid notes found in the file. Each note must have a non-empty title.');
          return;
        }

        const response = await notesService.importNotes(sanitizedEntries);
        if (response.success && response.data) {
          const newNotes = response.data;
          setNotes((prev) => {
            const map = new Map(prev.map((n) => [n.id, n]));
            newNotes.forEach((n) => map.set(n.id, n));
            return Array.from(map.values());
          });
        }
      } catch {
        alert('Failed to parse the JSON file. Please make sure it is a valid notes export.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-modern">
        <div className="dashboard-header-text">
          <h2 className="dashboard-title">Welcome back, {user?.name || 'User'}</h2>
          <p className="dashboard-subtitle">
            Capture ideas, keep your thoughts organized, and pick up where you left off.
          </p>
        </div>
        <div className="dashboard-header-actions">
          {!loading && !error && (
            <div className="note-count-pill">
              <strong>{notes.length}</strong> note{notes.length !== 1 ? 's' : ''}
            </div>
          )}
          <button
            type="button"
            className="dash-user-chip"
            onClick={() => setIsProfileModalOpen(true)}
            title="Account Settings"
            aria-label="Open Profile Settings"
          >
            <div className="dash-avatar">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="dash-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
          </button>
        </div>
      </header>

      {deleteError && (
        <div className="delete-error-banner" role="alert">
          {deleteError}
        </div>
      )}

      <div className="dashboard-toolbar">
        <div className="search-bar-modern">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notes-search-input-modern"
            aria-label="Search notes"
          />
        </div>
        <div className="toolbar-actions">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="notes-sort-select-modern"
            aria-label="Sort notes"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title-az">Title (A-Z)</option>
            <option value="title-za">Title (Z-A)</option>
          </select>
          <button type="button" onClick={handleExport} className="toolbar-btn" aria-label="Export notes">
            Export
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="toolbar-btn" aria-label="Import notes">
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="dashboard-main-content">
        {loading ? (
          <div className="loading-state">Loading your workspace...</div>
        ) : error ? (
          <div className="empty-state-modern">
            <div className="empty-state-icon">⚠️</div>
            <h4>Oops, something went wrong</h4>
            <p>{error}</p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-state-icon">📝</div>
            <h4>No notes yet</h4>
            <p>Your ideas deserve a place to live. Create your first note and start organizing your thoughts.</p>
            <button type="button" className="btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ marginTop: '1.5rem' }}>
              + Create your first note
            </button>
          </div>
        ) : (
          <>
            <div className="notes-section-header-modern">
              <h3>Your Notes</h3>
              <span className="notes-pagination">
                {displayedNotes.length} / {notes.length}
              </span>
            </div>

            {displayedNotes.length === 0 ? (
              <div className="empty-state-modern no-results">
                <p>No notes match your search &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
              </div>
            ) : (
              <div className="notes-grid-modern">
                {displayedNotes.map((note) => (
                  <div key={note.id} className="note-card-modern">
                    <div className="note-card-body-modern">
                      <div className="note-card-header-modern">
                        <h4 className="note-card-title-modern">{note.title}</h4>
                        <div style={{ position: 'relative' }}>
                          {pinnedNoteIds.includes(note.id) && (
                            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📌</span>
                          )}
                          <button
                            type="button"
                            className="card-action-menu-btn"
                            aria-label="Options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                            }}
                          >
                            ⋮
                          </button>
                          {activeMenuNoteId === note.id && (
                            <div 
                              className="card-dropdown-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="card-dropdown-item"
                                onClick={() => {
                                  togglePin(note.id);
                                  setActiveMenuNoteId(null);
                                }}
                              >
                                {pinnedNoteIds.includes(note.id) ? 'Unpin Note' : 'Pin Note'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className="note-card-content-modern"
                        dangerouslySetInnerHTML={{ __html: sanitize(note.content) }}
                      />
                      
                      <div className="note-card-divider"></div>

                      <div className="note-card-footer-modern">
                        <span className="note-date">
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="note-card-actions-modern">
                          <button
                            type="button"
                            className="card-action-btn edit"
                            onClick={() => setEditingNote(note)}
                            aria-label={`Edit ${note.title}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`card-action-btn delete ${deletingNoteId === note.id ? 'deleting' : ''}`}
                            onClick={() => handleDeleteClick(note)}
                            disabled={deletingNoteId === note.id}
                            aria-label={`Delete ${note.title}`}
                          >
                            {deletingNoteId === note.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!loading && !error && (
        <button
          type="button"
          className="fab-new-note"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create new note"
          title="New Note"
        >
          +
        </button>
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <NoteEditorModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }}
        onSave={handleCreateNote}
        isSubmitting={isCreating}
        error={createError}
      />

      {editingNote && (
        <NoteEditorModal
          isOpen={true}
          onClose={() => { setEditingNote(null); setEditError(''); }}
          onSave={handleUpdateNote}
          initialTitle={editingNote.title}
          initialContent={editingNote.content}
          isSubmitting={isUpdating}
          error={editError}
        />
      )}

      <Modal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} title="Confirm Delete">
        <p style={{ color: 'var(--text)', marginBottom: '1.5rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
          Are you sure you want to delete the note <strong>"{noteToDelete?.title}"</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setNoteToDelete(null)} style={{ padding: '0.5rem 1rem' }} disabled={deletingNoteId !== null}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={confirmDelete} 
            disabled={deletingNoteId !== null}
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              boxShadow: 'none' 
            }}
          >
            {deletingNoteId !== null ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
