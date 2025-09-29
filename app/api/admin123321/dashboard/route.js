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

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    // Authentication removed - direct access allowed
    // await verifyAdminSession(request)

    // Get dashboard statistics
    const stats = await adminQueries.getDashboardStats()

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}