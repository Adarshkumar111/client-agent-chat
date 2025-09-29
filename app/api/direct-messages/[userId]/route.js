import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { messageQueries, userQueries } from '@/lib/queries'

// GET /api/direct-messages/[userId] - Get direct messages between current user and specified user
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { userId } = resolvedParams
    const currentUserId = parseInt(session.user.id)
    const otherUserId = parseInt(userId)

    // Get the other user's details
    const otherUser = await userQueries.findById(otherUserId)

    if (!otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Agents can message anyone, users can only message agents
    if (session.user.role === 'USER' && otherUser.role !== 'AGENT') {
      return NextResponse.json({ error: 'Users can only message agents' }, { status: 403 })
    }

    // Get messages between the two users
    const allMessages = await messageQueries.getDirectMessages(currentUserId, otherUserId)
    
    // Filter out WhatsApp messages (messages starting with "📱 WhatsApp:")
    const messages = allMessages.filter(msg => !msg.content.startsWith('📱 WhatsApp:'))

    return NextResponse.json({
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        phone: otherUser.phone,
        role: otherUser.role,
        is_active: otherUser.is_active
      },
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        createdAt: msg.created_at,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name,
          role: msg.sender_role
        }
      })),
      currentUserId
    })

  } catch (error) {
    console.error('Error fetching direct messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/direct-messages/[userId] - Send direct message to specified user
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { userId } = resolvedParams
    const { content } = await request.json()
    const currentUserId = parseInt(session.user.id)
    const recipientId = parseInt(userId)

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Get the recipient user
    const recipient = await userQueries.findById(recipientId)

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    if (!recipient.is_active) {
      return NextResponse.json({ error: 'Recipient is not active' }, { status: 400 })
    }

    // Agents can message anyone, users can only message agents
    if (session.user.role === 'USER' && recipient.role !== 'AGENT') {
      return NextResponse.json({ error: 'Users can only message agents' }, { status: 403 })
    }

    // Save message to database
    const message = await messageQueries.create({
      content: content.trim(),
      senderId: currentUserId,
      receiverId: recipientId
    })

    // Get sender details for response
    const sender = await userQueries.findById(currentUserId)

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        createdAt: message.created_at,
        sender: {
          id: sender.id,
          name: sender.name,
          role: sender.role
        },
        recipient: {
          id: recipient.id,
          name: recipient.name,
          role: recipient.role
        }
      }
    })

  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}