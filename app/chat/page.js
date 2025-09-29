'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  PlusIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDate, getInitials } from '@/app/lib/utils'

export default function ChatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const groupsData = await response.json()
        setGroups(groupsData)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAgent = session?.user?.role === 'AGENT'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-3 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">All Chats</h1>
            </div>
            
            {isAgent && (
              <Link
                href="/groups/create"
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Group
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No chats found' : 'No chats available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : isAgent 
                    ? 'Create your first group to start chatting'
                    : 'Wait for an agent to add you to a group'
                }
              </p>
              {isAgent && !searchTerm && (
                <Link
                  href="/groups/create"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Group
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/chat/${group.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        {/* Group Avatar */}
                        <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {group.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {formatDate(group.updatedAt)}
                            </div>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">
                              {group.description || 'No description'}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 ml-4">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {group._count?.members || 0} members
                            </div>
                          </div>
                          
                          {/* Members preview */}
                          <div className="mt-2 flex items-center">
                            <div className="flex -space-x-2">
                              {group.creator && (
                                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium border-2 border-white">
                                  {getInitials(group.creator.name)}
                                </div>
                              )}
                              {/* Show first few members */}
                              {group.members && group.members.slice(0, 3).map((member, index) => (
                                <div
                                  key={member.user.id}
                                  className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium border-2 border-white ${
                                    member.user.role === 'AGENT' 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-green-500 text-white'
                                  }`}
                                  title={`${member.user.name} (${member.user.role})`}
                                >
                                  {getInitials(member.user.name)}
                                </div>
                              ))}
                              {group._count?.members > 4 && (
                                <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium border-2 border-white">
                                  +{group._count.members - 4}
                                </div>
                              )}
                            </div>
                            <span className="ml-3 text-xs text-gray-500">
                              Created by {group.creator?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message count indicator */}
                      {group._count?.messages > 0 && (
                        <div className="ml-4 flex-shrink-0">
                          <div className="bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 text-xs font-medium">
                            {group._count.messages} msg{group._count.messages !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {filteredGroups.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredGroups.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredGroups.reduce((sum, group) => sum + (group._count?.messages || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Now</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isAgent ? 'All Groups' : `${filteredGroups.length} Group${filteredGroups.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}