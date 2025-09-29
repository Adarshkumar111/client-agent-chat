import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { noteQueries, userQueries } from '@/lib/queries'

// GET /api/private-notes - Get all notes created by the current agent
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only agents can create/view notes
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden: Only agents can access private notes' }, { status: 403 })
    }

    const currentUserId = parseInt(session.user.id)
    const notes = await noteQueries.getByAuthor(currentUserId)

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching private notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/private-notes - Create a new private note
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only agents can create notes
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden: Only agents can create private notes' }, { status: 403 })
    }

    const { title, content, relatedUserId, tags } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      )
    }

    // Verify the related user exists (if provided)
    if (relatedUserId) {
      const targetUser = await userQueries.findById(parseInt(relatedUserId))
      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 404 }
        )
      }
    }

    // Create the private note
    const note = await noteQueries.create({
      title,
      content,
      authorId: parseInt(session.user.id),
      relatedUserId: relatedUserId ? parseInt(relatedUserId) : null,
      tags: tags || []
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating private note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}