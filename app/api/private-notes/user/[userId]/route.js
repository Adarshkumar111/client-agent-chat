import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { noteQueries } from '@/lib/queries'

// GET /api/private-notes/user/[userId] - Get notes for a specific user
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const { userId } = resolvedParams
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the agent parameter from query string for user requests
    const url = new URL(request.url)
    const agentId = url.searchParams.get('agentId')

    // Agents can view notes they created about any user
    // Users can only view notes about themselves from a specific agent
    if (session.user.role === 'AGENT') {
      // Agents can view notes they created about the specified user
      const notes = await noteQueries.getByUserAndAgent(parseInt(userId), parseInt(session.user.id))
      return NextResponse.json(notes)
    } else if (session.user.role === 'USER') {
      // Users can only view notes about themselves
      if (parseInt(session.user.id) !== parseInt(userId)) {
        return NextResponse.json({ error: 'Forbidden: You can only view notes about yourself' }, { status: 403 })
      }

      // Users can only see notes from the specific agent they're chatting with
      if (!agentId) {
        return NextResponse.json({ error: 'Agent ID is required for user requests' }, { status: 400 })
      }

      const notes = await noteQueries.getByUserAndAgent(parseInt(userId), parseInt(agentId))

      return NextResponse.json(notes)
    } else {
      return NextResponse.json({ error: 'Forbidden: Invalid user role' }, { status: 403 })
    }
  } catch (error) {
    console.error('Error fetching private notes for user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}