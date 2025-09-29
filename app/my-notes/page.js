'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function MyNotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notesSummary, setNotesSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentNotes, setAgentNotes] = useState([])

  // Redirect if not authenticated or not a user
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch notes summary
  useEffect(() => {
    const fetchNotesSummary = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)
        const response = await fetch('/api/private-notes/summary')
        if (response.ok) {
          const data = await response.json()
          setNotesSummary(data)
        } else {
          console.error('Failed to fetch notes summary')
          setNotesSummary([])
        }
      } catch (error) {
        console.error('Error fetching notes summary:', error)
        setNotesSummary([])
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchNotesSummary()
    }
  }, [session])

  // Fetch notes from specific agent
  const fetchAgentNotes = async (agentId) => {
    try {
      const response = await fetch(`/api/private-notes/user/${session.user.id}?agentId=${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgentNotes(data)
        setSelectedAgent(agentId)
      } else {
        console.error('Failed to fetch agent notes')
      }
    } catch (error) {
      console.error('Error fetching agent notes:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect via useEffect
  }

  // Only show this page to users (not agents)
  if (session.user.role !== 'USER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only available to users.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
              <p className="text-gray-600 mt-2">
                Private notes that agents have made about you
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="bg-white rounded-lg shadow">
          {!selectedAgent ? (
            // Summary View - List of agents who have made notes
            <>
              {notesSummary.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No notes yet</h3>
                  <p className="text-gray-600">
                    No agents have made any notes about you yet. Notes will appear here when they do.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes by Agent</h3>
                  <div className="space-y-4">
                    {notesSummary.map((agentData) => (
                      <div 
                        key={agentData.agent.id} 
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => fetchAgentNotes(agentData.agent.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{agentData.agent.name}</h4>
                            <p className="text-sm text-gray-600">{agentData.agent.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {agentData.totalNotes} {agentData.totalNotes === 1 ? 'note' : 'notes'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Last updated: {formatDate(agentData.latestNoteDate)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Click to view notes from this agent →
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Individual Agent Notes View
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Notes from {notesSummary.find(a => a.agent.id === selectedAgent)?.agent.name}
                </h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to all agents
                </button>
              </div>
              
              {agentNotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No notes from this agent.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agentNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="mb-3">
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-200 pt-3">
                        <div className="flex items-center space-x-4">
                          <span>
                            <strong>Created:</strong> {formatDate(note.createdAt)}
                          </span>
                          {note.updatedAt !== note.createdAt && (
                            <span className="text-blue-600">
                              <strong>Updated:</strong> {formatDate(note.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-400 text-xl mr-3">ℹ️</div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">About Private Notes</p>
              <p>
                These are private notes that agents have made about your interactions. 
                They help agents provide better service by remembering important details 
                about your conversations and preferences. Only you can see the notes made about you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}