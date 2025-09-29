import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { userQueries } from '@/lib/queries'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get users based on role permissions
    let users = await userQueries.getAll()
    
    if (session.user.role === 'AGENT') {
      // Agents can see all active users with phone numbers
      users = users.filter(user => user.is_active)
    } else {
      // Regular users can only see agents (without phone numbers)
      users = users.filter(user => user.is_active && user.role === 'AGENT')
      // Remove phone numbers for non-agent users
      users = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }))
    }

    // Sort by name
    users.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}