'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Client Agent Chat</span>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/auth/signin"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Manage WhatsApp Chats,{' '}
              <span className="text-indigo-600">Groups and Messages</span>{' '}
              at Scale
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect multiple numbers, create groups, manage conversations, and integrate 
              with your systems. The complete WhatsApp management platform for agents and users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Sign Up for Free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Everything you need for WhatsApp Management
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Powerful features designed for both agents and users
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Agent Inbox</h3>
                <p className="text-gray-600">
                  Shared inbox for multiple agents with role-based permissions and visibility controls.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Management</h3>
                <p className="text-gray-600">
                  Create and manage WhatsApp groups with advanced member controls and permissions.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Private Notes</h3>
                <p className="text-gray-600">
                  Encrypted private notes for team communication without users seeing them.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CogIcon className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp API</h3>
                <p className="text-gray-600">
                  Native WhatsApp Cloud API integration for seamless message delivery.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 text-lg text-gray-600">Get started in minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h3>
                <p className="text-gray-600">
                  Sign up as a user or request agent access. Users get immediate access.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Groups</h3>
                <p className="text-gray-600">
                  Agents can create groups and add users. Users can participate in conversations.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Chatting</h3>
                <p className="text-gray-600">
                  Begin conversations with WhatsApp integration and private note capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-400" />
              <span className="ml-2 text-lg font-semibold">Client Agent Chat</span>
            </div>
            <p className="text-gray-400">
              Built for modern WhatsApp management and team collaboration
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
