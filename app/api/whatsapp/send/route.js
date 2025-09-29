import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createWhatsAppURL, formatPhoneForWhatsApp } from '@/app/lib/whatsapp-utils'
import { groupQueries, userQueries } from '@/lib/queries'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both agents and users to send WhatsApp messages
    if (!['AGENT', 'USER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only agents and users can send WhatsApp messages' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, message, messageType = 'text', directUserId } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    let whatsappDelivery = {
      sent: 0,
      failed: 0,
      recipients: []
    }

    if (groupId) {
      try {
        const group = await groupQueries.getById(parseInt(groupId))
        if (!group) {
          return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        const members = await groupQueries.getMembers(parseInt(groupId))
        
        // Filter recipients based on sender role
        let targetMembers
        if (session.user.role === 'AGENT') {
          // Agents send to users
          targetMembers = members.filter(member => member.role === 'USER')
        } else {
          // Users send to agents
          targetMembers = members.filter(member => member.role === 'AGENT')
        }
        
        for (const member of targetMembers) {
          if (member.phone) {
            const whatsappUrl = createWhatsAppURL(member.phone, message.trim())
            if (whatsappUrl) {
              whatsappDelivery.recipients.push({
                userId: member.id,
                phone: member.phone,
                name: member.name,
                role: member.role,
                whatsappUrl: whatsappUrl,
                status: 'ready'
              })
              whatsappDelivery.sent++
            } else {
              whatsappDelivery.failed++
              whatsappDelivery.recipients.push({
                userId: member.id,
                phone: member.phone,
                name: member.name,
                role: member.role,
                status: 'failed',
                error: 'Invalid phone number'
              })
            }
          } else {
            whatsappDelivery.failed++
            whatsappDelivery.recipients.push({
              userId: member.id,
              name: member.name,
              role: member.role,
              status: 'failed',
              error: 'No phone number available'
            })
          }
        }

        return NextResponse.json({
          success: true,
          message: `WhatsApp URLs generated successfully for ${session.user.role === 'AGENT' ? 'users' : 'agents'}`,
          whatsappDelivery,
          groupId: parseInt(groupId),
          messageType,
          senderRole: session.user.role,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('Error processing group WhatsApp message:', error)
        return NextResponse.json({ 
          error: 'Failed to process WhatsApp message for group',
          details: error.message 
        }, { status: 500 })
      }
    } else if (directUserId) {
      // Handle direct WhatsApp messages (user to specific person)
      try {
        const targetUser = await userQueries.findById(parseInt(directUserId))
        if (!targetUser) {
          return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Check if user has phone number
        if (!targetUser.phone) {
          return NextResponse.json({ 
            error: 'Target user has no phone number available',
            whatsappDelivery: { sent: 0, failed: 1, recipients: [] }
          }, { status: 400 })
        }

        const whatsappUrl = createWhatsAppURL(targetUser.phone, message.trim())
        if (whatsappUrl) {
          whatsappDelivery.recipients.push({
            userId: targetUser.id,
            phone: targetUser.phone,
            name: targetUser.name,
            role: targetUser.role,
            whatsappUrl: whatsappUrl,
            status: 'ready'
          })
          whatsappDelivery.sent = 1
        } else {
          whatsappDelivery.failed = 1
          whatsappDelivery.recipients.push({
            userId: targetUser.id,
            phone: targetUser.phone,
            name: targetUser.name,
            role: targetUser.role,
            status: 'failed',
            error: 'Invalid phone number format'
          })
        }

        return NextResponse.json({
          success: true,
          message: 'WhatsApp URL generated for direct message',
          whatsappDelivery,
          directUserId: parseInt(directUserId),
          messageType,
          senderRole: session.user.role,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('Error processing direct WhatsApp message:', error)
        return NextResponse.json({ 
          error: 'Failed to process direct WhatsApp message',
          details: error.message 
        }, { status: 500 })
      }
    } else {
      // Missing required parameters
      return NextResponse.json({ 
        error: 'Either groupId or directUserId must be provided' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('WhatsApp send API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * Get WhatsApp integration status
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      status: 'active',
      integration: 'whatsapp-redirect',
      capabilities: [
        'direct-message-redirect',
        'group-message-urls',
        'phone-number-formatting',
        'url-generation',
        'bidirectional-messaging',
        'user-to-agent-messages',
        'agent-to-user-messages'
      ],
      message: 'WhatsApp integration is active using redirect URLs for both agents and users'
    })

  } catch (error) {
    console.error('WhatsApp status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check WhatsApp status',
      details: error.message 
    }, { status: 500 })
  }
}