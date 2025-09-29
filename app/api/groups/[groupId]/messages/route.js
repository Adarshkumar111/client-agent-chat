import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { groupQueries, messageQueries } from '@/lib/queries'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const groupId = resolvedParams.groupId
    
    // Check if user is member of this group
    const membership = await groupQueries.getMembership(parseInt(session.user.id), parseInt(groupId))

    // Agents can see any group, users only groups they're members of
    if (!membership && session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get group details
    const group = await groupQueries.findById(parseInt(groupId))

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get group members
    const members = await groupQueries.getMembers(parseInt(groupId))
    group.members = members

    // Get messages with visibility rules
    let messages
    
    if (session.user.role === 'USER') {
      // Users only see messages from agents and their own messages
      messages = await messageQueries.getGroupMessages(parseInt(groupId), 100, 0)
      // Filter messages to show only agent messages and user's own messages
      // Also exclude WhatsApp messages (messages starting with "📱 WhatsApp:")
      messages = messages.filter(msg => 
        (msg.sender_id === parseInt(session.user.id) || msg.sender_role === 'AGENT') &&
        !msg.content.startsWith('📱 WhatsApp:')
      )
    } else {
      // Agents can see all messages except WhatsApp messages
      messages = await messageQueries.getGroupMessages(parseInt(groupId), 100, 0)
      // Filter out WhatsApp messages for agents too
      messages = messages.filter(msg => !msg.content.startsWith('📱 WhatsApp:'))
    }

    return NextResponse.json({
      group,
      messages,
      currentUser: {
        id: session.user.id,
        role: session.user.role
      }
    })

  } catch (error) {
    console.error('Failed to fetch chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const groupId = resolvedParams.groupId
    const { content, messageType = 'TEXT' } = await request.json()

    // Check if user is member of this group or is an agent
    const membership = await groupQueries.getMembership(parseInt(session.user.id), parseInt(groupId))

    if (!membership && session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const message = await messageQueries.create({
      content,
      senderId: parseInt(session.user.id),
      groupId: parseInt(groupId),
      messageType
    })

    // Update group's updatedAt timestamp
    await groupQueries.updateTimestamp(parseInt(groupId))

    return NextResponse.json(message)

  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}