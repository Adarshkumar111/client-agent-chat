'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  UserIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  LockClosedIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import { formatDate, getInitials } from '@/app/lib/utils'
import { createWhatsAppURL, isValidWhatsAppPhone, formatPhoneDisplay, openWhatsAppChat } from '@/app/lib/whatsapp-utils'
import PrivateNotesPanel from '@/components/PrivateNotesPanel'

export default function DirectChatPage({ params }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [chatData, setChatData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showPrivateNotes, setShowPrivateNotes] = useState(false)
  const [hasNotes, setHasNotes] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')
  const [showRedirectUrl, setShowRedirectUrl] = useState(false)
  const [messageType, setMessageType] = useState('normal') // 'normal' or 'whatsapp'
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await fetch(`/api/direct-messages/${resolvedParams.userId}`)
        if (response.ok) {
          const data = await response.json()
          setChatData(data)
          setMessages(data.messages)
        } else if (response.status === 403) {
          router.push('/dashboard')
        } else if (response.status === 404) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch direct chat data:', error)
      } finally {
        setLoading(false)
      }
    }

    const checkForNotes = async () => {
      if (session?.user?.role === 'USER') {
        try {
          // For users, check if notes exist from the specific agent they're chatting with
          const response = await fetch(`/api/private-notes/user/${session.user.id}?agentId=${resolvedParams.userId}`)
          if (response.ok) {
            const notes = await response.json()
            setHasNotes(notes.length > 0)
          }
        } catch (error) {
          console.error('Failed to check for notes:', error)
        }
      }
    }

    if (resolvedParams.userId && session) {
      fetchChatData()
      checkForNotes()
    }
  }, [resolvedParams.userId, router, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    // If WhatsApp message type is selected, handle differently
    if (messageType === 'whatsapp') {
      sendWhatsAppMessage()
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/direct-messages/${resolvedParams.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        setMessages(prev => [...prev, result.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const sendWhatsAppMessage = () => {
    if (!chatData?.otherUser?.phone) {
      alert('Phone number not available for this user. Cannot send WhatsApp message.')
      return
    }

    if (!isValidWhatsAppPhone(chatData.otherUser.phone)) {
      alert('Invalid phone number format for WhatsApp.')
      return
    }

    // Open WhatsApp with the current message
    const success = openWhatsAppChat(chatData.otherUser.phone, newMessage)
    
    if (success) {
      // Clear the message input without saving to chat
      setNewMessage('')
      // Switch back to normal mode
      setMessageType('normal')
      // Show success feedback
      alert('WhatsApp opened successfully!')
    } else {
      alert('Failed to open WhatsApp. Please check the phone number.')
    }
  }

  const handleWhatsAppCustomMessage = () => {
    setShowWhatsAppModal(true)
    setWhatsappMessage('')
  }

  const sendCustomWhatsAppMessage = () => {
    if (!whatsappMessage.trim()) return

    if (!chatData?.otherUser?.phone) {
      alert('Phone number not available for this user.')
      return
    }

    if (!isValidWhatsAppPhone(chatData.otherUser.phone)) {
      alert('Invalid phone number format for WhatsApp.')
      return
    }

    const success = openWhatsAppChat(chatData.otherUser.phone, whatsappMessage)
    
    if (success) {
      setShowWhatsAppModal(false)
      setWhatsappMessage('')
      // Show success feedback
      alert('WhatsApp opened successfully!')
    } else {
      alert('Failed to open WhatsApp. Please check the phone number.')
    }
  }

  const generateRedirectUrl = async () => {
    try {
      const response = await fetch(`/api/chat/redirect?userId=${resolvedParams.userId}`)
      if (response.ok) {
        const result = await response.json()
        setRedirectUrl(result.redirectUrl)
        setShowRedirectUrl(true)
      }
    } catch (error) {
      console.error('Failed to generate redirect URL:', error)
    }
  }

  const copyRedirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(redirectUrl)
      alert('Redirect URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const MessageBubble = ({ message, isOwn }) => {
    const isAgent = message.sender.role === 'AGENT'
    
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-indigo-600 text-white' 
            : isAgent 
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'bg-gray-100 text-gray-900'
        }`}>
          {!isOwn && (
            <div className="flex items-center mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isAgent ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {getInitials(message.sender.name)}
              </div>
              <span className="ml-2 text-sm font-medium">
                {message.sender.name}
                {isAgent && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
                    AGENT
                  </span>
                )}
              </span>
            </div>
          )}
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
            {formatDate(message.createdAt)}
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

  const isAgent = session?.user?.role === 'AGENT'
  const otherUser = chatData.otherUser

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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
              otherUser.role === 'AGENT' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {getInitials(otherUser.name)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                {otherUser.name}
                {otherUser.role === 'AGENT' && (
                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    AGENT
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600">
                Direct Message
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generateRedirectUrl}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              title="Generate Chat Link"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            
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
              </>
            )}
            
            {!isAgent && (
              <button
                onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                className={`relative p-2 rounded-full ${
                  showPrivateNotes ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="View Notes About Me"
              >
                <DocumentTextIcon className="h-5 w-5" />
                {hasNotes && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Redirect URL Modal */}
      {showRedirectUrl && (
        <div className="bg-blue-50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">Chat Redirect URL:</p>
              <div className="flex items-center mt-1 space-x-2">
                <input
                  type="text"
                  value={redirectUrl}
                  readOnly
                  className="flex-1 text-sm bg-white border border-blue-200 rounded px-2 py-1 text-blue-900"
                />
                <button
                  onClick={copyRedirectUrl}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Copy URL"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowRedirectUrl(false)}
              className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showPrivateNotes ? 'border-r' : ''}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserIcon className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-sm text-center">
                  {isAgent 
                    ? `Start a conversation with ${otherUser.name}`
                    : `Start a conversation with ${otherUser.name}. Type your message below.`
                  }
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === session.user.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            {/* Message Type Toggle */}
            <div className="flex items-center justify-center mb-3 space-x-2">
              <button
                onClick={() => setMessageType('normal')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  messageType === 'normal' 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>Normal Chat</span>
              </button>
              <button
                onClick={() => setMessageType('whatsapp')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  messageType === 'whatsapp' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={!chatData?.otherUser?.phone || !isValidWhatsAppPhone(chatData?.otherUser?.phone)}
                title={
                  !chatData?.otherUser?.phone 
                    ? "Phone number not available"
                    : !isValidWhatsAppPhone(chatData?.otherUser?.phone)
                    ? "Invalid phone number format"
                    : "Send via WhatsApp"
                }
              >
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
              {chatData?.otherUser?.phone && (
                <button
                  onClick={handleWhatsAppCustomMessage}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                  title="Send custom WhatsApp message"
                >
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  <span>Custom</span>
                </button>
              )}
            </div>

            {/* Phone Number Display */}
            {chatData?.otherUser?.phone && (
              <div className="text-xs text-gray-500 text-center mb-2">
                {isValidWhatsAppPhone(chatData.otherUser.phone) ? (
                  <span className="text-green-600">
                    📱 WhatsApp: {formatPhoneDisplay(chatData.otherUser.phone)}
                  </span>
                ) : (
                  <span className="text-red-500">
                    ⚠️ Invalid phone format: {chatData.otherUser.phone}
                  </span>
                )}
              </div>
            )}

            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  messageType === 'whatsapp'
                    ? `WhatsApp message to ${otherUser.name}...`
                    : isAgent 
                    ? "Type your message..."
                    : `Message ${otherUser.name}...`
                }
                className={`flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-black ${
                  messageType === 'whatsapp' 
                    ? 'border-green-300 focus:ring-green-500' 
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  messageType === 'whatsapp'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
                title={messageType === 'whatsapp' ? 'Send via WhatsApp' : 'Send message'}
              >
                {messageType === 'whatsapp' ? (
                  <DevicePhoneMobileIcon className="h-5 w-5" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </form>
            
            {/* Status Message */}
            <div className="text-xs text-center mt-2">
              {messageType === 'whatsapp' ? (
                <p className="text-green-600">
                  WhatsApp mode - Message will open in WhatsApp app
                </p>
              ) : session?.user?.role === 'USER' ? (
                <p className="text-gray-500">
                  Direct message with agent
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Private Notes Panel (Agent and User) */}
        {showPrivateNotes && (
          <PrivateNotesPanel 
            userId={isAgent ? otherUser.id : session.user.id} 
            userName={isAgent ? otherUser.name : session.user.name}
            agentId={isAgent ? session.user.id : otherUser.id}
          />
        )}

        {/* WhatsApp Custom Message Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-green-600 mr-2" />
                  Send WhatsApp Message
                </h3>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  To: <span className="font-medium">{otherUser.name}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  📱 {formatPhoneDisplay(chatData?.otherUser?.phone)}
                </p>
                
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Type your WhatsApp message..."
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={sendCustomWhatsAppMessage}
                  disabled={!whatsappMessage.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}