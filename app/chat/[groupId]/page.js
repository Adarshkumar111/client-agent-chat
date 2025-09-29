'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { formatDate, getInitials } from '@/app/lib/utils'

export default function ChatPage({ params }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [chatData, setChatData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showPrivateNotes, setShowPrivateNotes] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true)
  const [whatsappStatus, setWhatsappStatus] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await fetch(`/api/groups/${resolvedParams.groupId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setChatData(data)
          setMessages(data.messages)
        } else if (response.status === 403) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error)
      } finally {
        setLoading(false)
      }
    }

    const checkWhatsAppStatus = async () => {
      if (session?.user?.role === 'AGENT') {
        try {
          const response = await fetch('/api/whatsapp/send')
          if (response.ok) {
            const status = await response.json()
            setWhatsappEnabled(status.configured)
            setWhatsappStatus(status)
          }
        } catch (error) {
          console.error('Failed to check WhatsApp status:', error)
        }
      }
    }

    if (resolvedParams.groupId) {
      fetchChatData()
      checkWhatsAppStatus()
    }
  }, [resolvedParams.groupId, router, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      // Determine if this should be sent via WhatsApp
      const shouldSendWhatsApp = sendViaWhatsapp && 
                                whatsappEnabled && 
                                ['AGENT', 'USER'].includes(session?.user?.role)

      let response, message
      
      if (shouldSendWhatsApp) {
        // Send via WhatsApp API
        response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            groupId: resolvedParams.groupId,
            message: newMessage.trim(),
            messageType: 'text'
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          // Show WhatsApp delivery status
          if (result.whatsappDelivery && result.whatsappDelivery.sent > 0) {
            const recipientType = session?.user?.role === 'AGENT' ? 'users' : 'agents'
            alert(`WhatsApp URLs generated for ${result.whatsappDelivery.sent} ${recipientType}. Please open WhatsApp manually to send messages.`)
            console.log(`WhatsApp message ready for ${result.whatsappDelivery.sent} ${recipientType}`, result.whatsappDelivery.recipients)
          } else {
            const recipientType = session?.user?.role === 'AGENT' ? 'users' : 'agents'
            alert(`No valid WhatsApp ${recipientType} found in this group.`)
          }
          
          // Clear the message without adding to chat
          setNewMessage('')
          setSending(false)
          return // Exit early, don't save to chat
        }
      } else {
        // Send via regular chat API
        response = await fetch(`/api/groups/${resolvedParams.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: newMessage.trim()
          })
        })

        if (response.ok) {
          message = await response.json()
        }
      }

      if (response.ok && message) {
        setMessages(prev => [...prev, message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const isMessageVisible = (message) => {
    if (session?.user?.role === 'AGENT') {
      return true // Agents see all messages
    }
    
    // Users only see their own messages and messages from agents
    return message.sender_id === parseInt(session?.user?.id) || message.sender_role === 'AGENT'
  }

  const MessageBubble = ({ message, isOwn }) => {
    const isAgent = message.sender_role === 'AGENT'
    const isFromWhatsApp = message.isFromWhatsApp
    
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
          isOwn 
            ? 'bg-indigo-600 text-white' 
            : isAgent 
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'bg-gray-100 text-gray-900'
        }`}>
          {isFromWhatsApp && (
            <div className="absolute -top-1 -right-1">
              <PhoneIcon className="h-4 w-4 text-green-600 bg-white rounded-full p-0.5" />
            </div>
          )}
          {!isOwn && (
            <div className="flex items-center mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isAgent ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {getInitials(message.sender_name)}
              </div>
              <span className="ml-2 text-sm font-medium">
                {message.sender_name}
                {isAgent && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
                    AGENT
                  </span>
                )}
                {isFromWhatsApp && (
                  <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">
                    WhatsApp
                  </span>
                )}
              </span>
            </div>
          )}
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
            {formatDate(message.created_at)}
            {isFromWhatsApp && !isOwn && (
              <span className="ml-1">📱</span>
            )}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chat...</div>
      </div>
    )
  }

  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const visibleMessages = messages.filter(isMessageVisible)
  const isAgent = session?.user?.role === 'AGENT'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {chatData.group.name}
              </h1>
              <p className="text-sm text-gray-600">
                {chatData.group.members?.length || 0} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAgent && (
              <>
                <button
                  onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                  className={`p-2 rounded-full ${
                    showPrivateNotes ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Private Notes"
                >
                  <LockClosedIcon className="h-5 w-5" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                  title="Group Settings"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Group Description */}
      {chatData.group.description && (
        <div className="bg-blue-50 px-4 py-2 border-b">
          <p className="text-sm text-blue-800">
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            {chatData.group.description}
          </p>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showPrivateNotes ? 'border-r' : ''}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserGroupIcon className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-sm text-center">
                  {isAgent 
                    ? 'Start the conversation with your customers'
                    : 'An agent will respond to you soon'
                  }
                </p>
              </div>
            ) : (
              <>
                {visibleMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === parseInt(session.user.id)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            {/* WhatsApp Controls for Agents */}
            {isAgent && whatsappEnabled && (
              <div className="flex items-center justify-between mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">WhatsApp Integration</span>
                  <div className="flex items-center">
                    {whatsappEnabled ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendViaWhatsapp}
                    onChange={(e) => setSendViaWhatsapp(e.target.checked)}
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-green-700">
                    Send via WhatsApp
                  </span>
                </label>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isAgent && sendViaWhatsapp && whatsappEnabled 
                    ? "Type your message (will be sent via WhatsApp)..." 
                    : "Type your message..."
                }
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAgent && sendViaWhatsapp && whatsappEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isAgent && sendViaWhatsapp && whatsappEnabled ? (
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </form>
            
            {session?.user?.role === 'USER' && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                You can only see messages from agents and your own messages
              </p>
            )}
            
            {isAgent && !whatsappEnabled && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                WhatsApp integration not configured. Messages will be sent via chat only.
              </p>
            )}
          </div>
        </div>

        {/* Private Notes Panel (Agent Only) */}
        {isAgent && showPrivateNotes && (
          <div className="w-80 bg-purple-50 flex flex-col">
            <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-2" />
                Private Notes
              </h3>
              <p className="text-xs text-purple-700 mt-1">
                Only visible to agents
              </p>
            </div>
            <div className="flex-1 p-4">
              <div className="text-center text-purple-600">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Private notes feature</p>
                <p className="text-xs text-purple-500 mt-1">Coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members List (Mobile Toggle) */}
      <div className="md:hidden">
        {/* Mobile members drawer would go here */}
      </div>
    </div>
  )
}