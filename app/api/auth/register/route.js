import { NextResponse } from 'next/server'
import { userQueries } from '@/lib/queries'
import { hashPassword } from '@/app/lib/encryption'

export async function POST(request) {
  try {
    const { name, email, phone, password, role = 'USER' } = await request.json()

    // Check if user already exists
    const existingUserByEmail = await userQueries.findByEmail(email)
    
    // Check if phone exists (if provided)
    let existingUserByPhone = null
    if (phone) {
      existingUserByPhone = await userQueries.findByPhone(phone)
    }

    if (existingUserByEmail || existingUserByPhone) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Determine if user should be active (users are active, agents need approval)
    const isActive = role.toUpperCase() !== 'AGENT'

    // Create user
    const user = await userQueries.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role.toUpperCase(),
      isActive
    })

    return NextResponse.json({
      message: role.toUpperCase() === 'USER' 
        ? 'User account created successfully' 
        : 'Agent account request submitted. Please contact admin for approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}