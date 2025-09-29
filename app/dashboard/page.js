'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  PlusIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { formatDate, getInitials } from '@/app/lib/utils'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [conversations, setConversations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('groups') // 'groups' or 'direct'

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      // Fetch groups, conversations, and users
      const requests = [
        fetch('/api/groups'),
        fetch('/api/conversations'),
        fetch('/api/users')
      ]
      
      const [groupsRes, conversationsRes, usersRes] = await Promise.all(requests)
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData)
      }
      
      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json()
        setConversations(conversationsData.conversations || [])
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const isAgent = session.user.role === 'AGENT'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Chat Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* My Notes link for users */}
              {!isAgent && (
                <button
                  onClick={() => router.push('/my-notes')}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900 hover:cursor-pointer"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1 hover:cursor-pointer" />
                  My Notes
                </button>
              )}
              
              <span className="text-sm text-gray-700">
                Welcome, {session.user.name}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isAgent ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {session.user.role}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900 hover:cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1 hover:cursor-pointer" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'groups'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Group Chats ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'direct'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
              Direct Messages ({conversations.length})
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Direct Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'groups' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Group Chats</h2>
                {isAgent && (
                  <button 
                    onClick={() => router.push('/groups/create')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center hover:cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Group
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No groups found. {isAgent ? 'Create your first group to get started.' : 'Wait for an agent to add you to a group.'}
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => router.push(`/chat/${group.id}`)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-8 w-8 text-gray-400" />
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600">{group.description || 'No description'}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {group.members?.length || 0} members
                            <ClockIcon className="h-3 w-3 ml-3 mr-1" />
                            Updated {formatDate(group.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-indigo-600 hover:text-indigo-900">
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'direct' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Direct Messages</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {isAgent 
                    ? 'No direct message conversations yet. Start by messaging a user directly.' 
                    : 'No direct messages yet. You can start a conversation with any available agent below, or wait for an agent to message you.'}
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.user.id}
                    onClick={() => router.push(`/direct-chat/${conversation.user.id}`)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          conversation.user.role === 'AGENT' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {getInitials(conversation.user.name)}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {conversation.user.name}
                            </h3>
                            {conversation.user.role === 'AGENT' && (
                              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                AGENT
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage ? (
                            <>
                              <p className="text-sm text-gray-600 truncate max-w-md">
                                {conversation.lastMessage.isOwnMessage ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(conversation.lastMessage.createdAt)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No messages yet</p>
                          )}
                        </div>
                      </div>
                      <div className="text-indigo-600 hover:text-indigo-900">
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}