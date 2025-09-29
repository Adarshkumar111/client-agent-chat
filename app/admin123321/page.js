'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserGroupIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [agents, setAgents] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)
  const router = useRouter()

  // Fetch admin data without authentication
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, agentsResponse, usersResponse] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/users?role=AGENT&limit=100'),
          fetch('/api/admin/users?role=USER&limit=100')
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          setAgents(agentsData.users)
          setUsers(agentsData.users) // Keep backward compatibility
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAllUsers(usersData.users)
        }
      } catch (error) {
        setError('Failed to fetch dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, agentsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/users?role=AGENT&limit=100'),
        fetch('/api/admin/users?role=USER&limit=100')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        setAgents(agentsData.users)
        setUsers(agentsData.users) // Keep backward compatibility
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setAllUsers(usersData.users)
      }
    } catch (error) {
      setError('Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserStatusUpdate = async (userId, isActive) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive }),
      })

      if (response.ok) {
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        ))
        
        // Refresh stats
        fetchDashboardData()
      } else {
        setError('Failed to update user status')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  // Logout functionality removed - no session to logout from
  // const handleLogout = async () => {
  //   try {
  //     await fetch('/api/admin/auth', { method: 'DELETE' })
  //     router.push('/admin/login')
  //   } catch (error) {
  //     router.push('/admin/login')
  //   }
  // }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        setPasswordSuccess('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setTimeout(() => {
          setShowChangePasswordModal(false)
          setPasswordSuccess('')
          setShowCurrentPassword(false)
          setShowNewPassword(false)
          setShowConfirmPassword(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        setPasswordError(errorData.error || 'Failed to change password')
      }
    } catch (error) {
      setPasswordError('Network error occurred')
    }
  }

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    setPasswordError('')
  }

  // Delete user functions
  const handleDeleteUser = (userId, userName, userType) => {
    setDeleteConfirmModal({ userId, userName, userType })
  }

  const confirmDeleteUser = async () => {
    const { userId, userType } = deleteConfirmModal
    setDeleteConfirmModal(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Remove user from appropriate state array
        if (userType === 'AGENT') {
          setAgents(prev => prev.filter(agent => agent.id !== userId))
          setUsers(prev => prev.filter(user => user.id !== userId))
        } else {
          setAllUsers(prev => prev.filter(user => user.id !== userId))
        }
        
        // Refresh stats
        fetchDashboardData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('Network error occurred')
    }
  }

  const cancelDeleteUser = () => {
    setDeleteConfirmModal(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:cursor-pointer"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Change Password
              </button>
              {/* Logout button removed - no session to logout from */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('agents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'agents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Agent Management
            </button>
            <button
              onClick={() => setSelectedTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stats Cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_users}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Agents
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_agents}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pending Agents
                        </dt>
                        <dd className="text-lg font-medium text-orange-600">
                          {stats.pending_agents}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Groups
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_groups}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Messages
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_messages}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Private Notes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_notes}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {selectedTab === 'agents' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Agent Management
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Approve or reject agent registration requests
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Registered: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!user.is_active && (
                          <button
                            onClick={() => handleUserStatusUpdate(user.id, true)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 hover:cursor-pointer"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                        )}
                        {user.is_active && (
                          <button
                            onClick={() => handleUserStatusUpdate(user.id, false)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name, 'AGENT')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No agents found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  User Management
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View and manage all registered users
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <li key={user.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Phone: {user.phone || 'Not provided'} • Role: {user.role}
                          </p>
                          <p className="text-xs text-gray-400">
                            Registered: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name, 'USER')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {allUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="px-6 py-4">
              {passwordError && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{passwordError}</div>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 rounded-md bg-green-50 p-3">
                  <div className="text-sm text-green-700">{passwordSuccess}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                    setPasswordSuccess('')
                    setShowCurrentPassword(false)
                    setShowNewPassword(false)
                    setShowConfirmPassword(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md hover:cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete {deleteConfirmModal.userType === 'AGENT' ? 'Agent' : 'User'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirmModal.userName}</strong>? 
              This action will permanently remove all their data including messages, notes, and group memberships. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}