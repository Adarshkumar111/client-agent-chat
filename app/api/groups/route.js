import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { groupQueries, queryRows } from '@/lib/queries'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = parseInt(session.user.id)

    // Get groups based on user role
    let groupsQuery
    let queryParams
    
    if (session.user.role === 'AGENT') {
      // Agents can see all groups
      groupsQuery = `
        SELECT g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at,
               u.name as creator_name, u.role as creator_role,
               COUNT(DISTINCT gm.user_id) as member_count,
               COUNT(DISTINCT m.id) as message_count
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN messages m ON g.id = m.group_id
        GROUP BY g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at, u.name, u.role
        ORDER BY g.updated_at DESC
      `
      queryParams = []
    } else {
      // Users can only see groups they are members of
      groupsQuery = `
        SELECT g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at,
               u.name as creator_name, u.role as creator_role,
               COUNT(DISTINCT gm.user_id) as member_count,
               COUNT(DISTINCT m.id) as message_count
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN messages m ON g.id = m.group_id
        WHERE g.id IN (
          SELECT group_id FROM group_members WHERE user_id = $1
        )
        GROUP BY g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at, u.name, u.role
        ORDER BY g.updated_at DESC
      `
      queryParams = [currentUserId]
    }

    const groups = await queryRows(groupsQuery, queryParams)

    // Get members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await queryRows(`
          SELECT u.id, u.name, u.email, u.role, gm.joined_at
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1
          ORDER BY gm.joined_at ASC
        `, [group.id])

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          createdBy: group.created_by,
          createdAt: group.created_at,
          updatedAt: group.updated_at,
          creator: {
            id: group.created_by,
            name: group.creator_name,
            role: group.creator_role
          },
          _count: {
            members: parseInt(group.member_count),
            messages: parseInt(group.message_count)
          },
          members: members.map(member => ({
            user: {
              id: member.id,
              name: member.name,
              email: member.email,
              role: member.role
            },
            joinedAt: member.joined_at
          }))
        }
      })
    )

    return NextResponse.json(groupsWithMembers)
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, memberIds = [] } = await request.json()

    const group = await groupQueries.create({
      name,
      description,
      createdBy: parseInt(session.user.id)
    })

    // Add the creator as a member of the group
    await groupQueries.addMember(group.id, parseInt(session.user.id))

    // Add other members to the group if specified
    if (memberIds.length > 0) {
      for (const memberId of memberIds) {
        await groupQueries.addMember(group.id, parseInt(memberId))
      }
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}