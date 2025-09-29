import { NextResponse } from 'next/server'
import { adminQueries } from '@/lib/queries'
import { AdminSession } from '@/lib/admin-session'

// Middleware to verify admin session
async function verifyAdminSession(request) {
  try {
    return await AdminSession.verify(request)
  } catch (error) {
    throw new Error('Unauthorized')
  }
}

// GET /api/admin/users - Get all users with filtering and pagination
export async function GET(request) {
  try {
    // Authentication removed - direct access allowed
    // await verifyAdminSession(request)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const role = url.searchParams.get('role') // 'USER', 'AGENT', or null for all
    const offset = (page - 1) * limit

    // Get users
    const users = await adminQueries.getAllUsers(limit, offset, role)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users - Update user status (approve/reject agents)
export async function PATCH(request) {
  try {
    // Authentication removed - direct access allowed
    // await verifyAdminSession(request)

    const { userId, isActive } = await request.json()

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      )
    }

    // Update user status
    const updatedUser = await adminQueries.updateUserStatus(userId, isActive)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request) {
  try {
    // Authentication removed - direct access allowed
    // await verifyAdminSession(request)

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete user and all related data
    const deletedUser = await adminQueries.deleteUser(userId)

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      user: deletedUser
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}