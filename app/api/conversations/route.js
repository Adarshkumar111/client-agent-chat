import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { queryRows, userQueries } from '@/lib/queries'

// GET /api/conversations - Get list of all users that have direct message conversations
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = parseInt(session.user.id)

    // Get all direct messages involving current user with user details
    const conversations = await queryRows(`
      SELECT DISTINCT 
        CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.name as other_user_name,
        u.role as other_user_role,
        (SELECT content FROM messages m2 
         WHERE ((m2.sender_id = $1 AND m2.receiver_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) 
                OR (m2.receiver_id = $1 AND m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END))
           AND m2.group_id IS NULL
         ORDER BY m2.created_at DESC LIMIT 1) as last_message_content,
        (SELECT created_at FROM messages m2 
         WHERE ((m2.sender_id = $1 AND m2.receiver_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) 
                OR (m2.receiver_id = $1 AND m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END))
           AND m2.group_id IS NULL
         ORDER BY m2.created_at DESC LIMIT 1) as last_message_time
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE (m.sender_id = $1 OR m.receiver_id = $1) 
        AND m.group_id IS NULL
      ORDER BY last_message_time DESC
    `, [currentUserId])

    // Format the response
    let formattedConversations = conversations.map(conv => ({
      user: {
        id: conv.other_user_id,
        name: conv.other_user_name,
        role: conv.other_user_role
      },
      lastMessage: conv.last_message_content ? {
        content: conv.last_message_content,
        createdAt: conv.last_message_time
      } : null
    }))

    // If user is an agent, also include all users they haven't messaged yet
    if (session.user.role === 'AGENT') {
      const existingUserIds = [currentUserId, ...conversations.map(c => c.other_user_id)]
      
      const otherUsers = await queryRows(`
        SELECT id, name, role 
        FROM users 
        WHERE id != ALL($1::int[]) 
          AND is_active = true
        ORDER BY name ASC
      `, [existingUserIds])

      // Add users without conversation history
      otherUsers.forEach(user => {
        formattedConversations.push({
          user: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          lastMessage: null
        })
      })
    } else {
      // If user is a regular user, also include all agents they haven't messaged yet
      const existingUserIds = [currentUserId, ...conversations.map(c => c.other_user_id)]
      
      const availableAgents = await queryRows(`
        SELECT id, name, role 
        FROM users 
        WHERE id != ALL($1::int[]) 
          AND role = 'AGENT' 
          AND is_active = true
        ORDER BY name ASC
      `, [existingUserIds])

      // Add agents without conversation history
      availableAgents.forEach(agent => {
        formattedConversations.push({
          user: {
            id: agent.id,
            name: agent.name,
            role: agent.role
          },
          lastMessage: null
        })
      })
    }

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}