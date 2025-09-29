const adminSessions = new Map()

export const AdminSession = {
  // Create a new session
  create(adminData) {
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    adminSessions.set(sessionId, {
      ...adminData,
      loginTime: Date.now()
    })
    
    return sessionId
  },

  // Get session data
  get(sessionId) {
    if (!sessionId) return null
    
    const session = adminSessions.get(sessionId)
    
    if (!session) return null

    // Check if session is expired (24 hours)
    const isExpired = Date.now() - session.loginTime > 24 * 60 * 60 * 1000
    
    if (isExpired) {
      adminSessions.delete(sessionId)
      return null
    }
    
    return session
  },

  // Delete session
  delete(sessionId) {
    if (sessionId) {
      adminSessions.delete(sessionId)
    }
  },

  // Verify admin session from request
  async verify(request) {
    const sessionId = request.cookies.get('admin_session')?.value
    const session = this.get(sessionId)
    
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }
    
    return session
  }
}