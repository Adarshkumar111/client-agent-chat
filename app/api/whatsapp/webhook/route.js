import { NextResponse } from 'next/server'

export async function GET(request) {
  // WhatsApp webhook verification
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify token (you would set this in your environment variables)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified!')
    return new Response(challenge, { status: 200 })
  } else {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Process incoming WhatsApp messages here
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))
    
    // For now, just acknowledge receipt
    return NextResponse.json({ status: 'received' }, { status: 200 })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}