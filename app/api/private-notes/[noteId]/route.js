import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { noteQueries } from '@/lib/queries'

// PUT /api/private-notes/[noteId] - Update a private note
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const { noteId } = resolvedParams
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only agents can update notes
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden: Only agents can update private notes' }, { status: 403 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    // Verify the note exists and belongs to the current agent
    const existingNote = await noteQueries.findById(parseInt(noteId))

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    if (existingNote.author_id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own notes' },
        { status: 403 }
      )
    }

    // Update the note
    const updatedNote = await noteQueries.update(parseInt(noteId), { 
      title: existingNote.title, 
      content, 
      tags: existingNote.tags || [] 
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Error updating private note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/private-notes/[noteId] - Delete a private note
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const { noteId } = resolvedParams
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only agents can delete notes
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden: Only agents can delete private notes' }, { status: 403 })
    }

    // Verify the note exists and belongs to the current agent
    const existingNote = await noteQueries.findById(parseInt(noteId))

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    if (existingNote.author_id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own notes' },
        { status: 403 }
      )
    }

    // Delete the note
    await noteQueries.delete(parseInt(noteId))

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting private note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}