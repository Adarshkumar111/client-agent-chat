import { NextResponse } from 'next/server'
import { adminQueries } from '@/lib/queries'
import bcrypt from 'bcryptjs'
import { AdminSession } from '@/lib/admin-session'

// POST /api/admin/auth - Admin login
export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find admin by username
    const admin = await adminQueries.findByUsername(username)

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session
    const sessionId = AdminSession.create({
      id: admin.id,
      username: admin.username,
      role: 'ADMIN'
    })

    // Create response with session ID in cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: 'ADMIN'
      }
    })

    response.cookies.set('admin_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/auth - Verify admin session
export async function GET(request) {
  try {
    const sessionId = request.cookies.get('admin_session')?.value
    const session = AdminSession.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      admin: {
        id: session.id,
        username: session.username,
        role: session.role
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}

// DELETE /api/admin/auth - Admin logout
export async function DELETE(request) {
  const sessionId = request.cookies.get('admin_session')?.value
  
  AdminSession.delete(sessionId)

  const response = NextResponse.json({ success: true })
  
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}