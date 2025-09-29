'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function PrivateNotesPanel({ userId, userName, agentId }) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)

  const isAgent = session?.user?.role === 'AGENT'

  // Fetch notes for the user
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true)
        
        // For users, include the agent ID to get notes from that specific agent
        let url = `/api/private-notes/user/${userId}`
        if (!isAgent && agentId) {
          url += `?agentId=${agentId}`
        }
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setNotes(data)
        } else {
          console.error('Failed to fetch notes')
          setNotes([])
        }
      } catch (error) {
        console.error('Error fetching notes:', error)
        setNotes([])
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchNotes()
    }
  }, [userId, isAgent, agentId])

  // Add new note (agent only)
  const handleAddNote = async () => {
    if (!newNote.trim() || !isAgent) return

    try {
      const response = await fetch('/api/private-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Note for ${userName || 'User'}`,
          content: newNote.trim(),
          relatedUserId: userId
        })
      })

      if (response.ok) {
        const newNoteData = await response.json()
        setNotes([newNoteData, ...notes])
        setNewNote('')
        setIsAddingNote(false)
      } else {
        console.error('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  // Edit note (agent only)
  const handleEditNote = async (noteId) => {
    if (!editContent.trim() || !isAgent) return

    try {
      const response = await fetch(`/api/private-notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      })

      if (response.ok) {
        const updatedNote = await response.json()
        setNotes(notes.map(note => 
          note.id === noteId ? updatedNote : note
        ))
        setEditingNote(null)
        setEditContent('')
      } else {
        console.error('Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  // Delete note (agent only)
  const handleDeleteNote = async (noteId) => {
    if (!isAgent) return
    setDeleteConfirmModal(noteId)
  }

  // Confirm delete note
  const confirmDeleteNote = async () => {
    const noteId = deleteConfirmModal
    setDeleteConfirmModal(null)

    try {
      const response = await fetch(`/api/private-notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId))
      } else {
        console.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  // Cancel delete note
  const cancelDeleteNote = () => {
    setDeleteConfirmModal(null)
  }

  const startEdit = (note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditContent('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-gray-50 border-l border-gray-200 w-80 flex items-center justify-center">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-medium text-gray-900">
          {isAgent ? `My notes about ${userName}` : `Notes from this agent`}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {isAgent 
            ? 'Private notes only visible between you and this user' 
            : 'Private notes from this agent about you'
          }
        </p>
      </div>

      {/* Add Note Section (Agent Only) */}
      {isAgent && (
        <div className="p-4 border-b border-gray-200 bg-white">
          {!isAddingNote ? (
            <button
              onClick={() => setIsAddingNote(true)}
              className="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Note
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex-1 py-1 px-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingNote(false)
                    setNewNote('')
                  }}
                  className="flex-1 py-1 px-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {isAgent ? 'No notes yet. Add your first note above.' : 'No notes have been made about you yet.'}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditNote(note.id)}
                        className="flex-1 py-1 px-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 py-1 px-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
                      {note.content}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>
                        By: {note.author_name} • {formatDate(note.created_at)}
                        {note.updated_at !== note.created_at && ' (edited)'}
                      </div>
                      {isAgent && note.author_id === session.user.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(note)}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Note
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteNote}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNote}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors hover:cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}