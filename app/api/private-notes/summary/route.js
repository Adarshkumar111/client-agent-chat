import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { noteQueries } from '@/lib/queries'

// GET /api/private-notes/summary - Get summary of notes by agent for current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only users can access this summary endpoint
    if (session.user.role !== 'USER') {
      return NextResponse.json({ error: 'Forbidden: Only users can access notes summary' }, { status: 403 })
    }

    // Get all notes about the user, grouped by agent
    const notes = await noteQueries.getByUserId(parseInt(session.user.id))

    // Group notes by agent
    const notesByAgent = {}
    notes.forEach(note => {
      const agentId = note.created_by
      if (!notesByAgent[agentId]) {
        notesByAgent[agentId] = {
          agent: { id: agentId, name: note.creator_name, email: note.creator_email },
          notes: [],
          totalNotes: 0,
          latestNoteDate: null
        }
      }
      notesByAgent[agentId].notes.push(note)
      notesByAgent[agentId].totalNotes += 1
      if (!notesByAgent[agentId].latestNoteDate || new Date(note.updated_at) > new Date(notesByAgent[agentId].latestNoteDate)) {
        notesByAgent[agentId].latestNoteDate = note.updated_at
      }
    })

    // Convert to array and sort by latest note date
    const summary = Object.values(notesByAgent).sort((a, b) => 
      new Date(b.latestNoteDate) - new Date(a.latestNoteDate)
    )

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching notes summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}