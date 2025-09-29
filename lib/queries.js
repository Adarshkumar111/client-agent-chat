/**
 * Database Query Helpers
 * 
 * This file contains helper functions for common database operations.
 * All functions use raw SQL queries with the pg library.
 */

import { query, queryRow, queryRows } from '../app/lib/prisma.js';

// Re-export base query functions for direct use
export { query, queryRow, queryRows };

// User operations
export const userQueries = {
  // Create a new user
  async create({ name, email, phone, password, role = 'USER', isActive = true }) {
    const result = await queryRow(
      `INSERT INTO users (name, email, phone, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email, phone, password, role, isActive]
    );
    return result;
  },

  // Find user by email
  async findByEmail(email) {
    return await queryRow(
      'SELECT id, name, email, phone, password, role, is_active, created_at FROM users WHERE email = $1',
      [email]
    );
  },

  // Find user by phone
  async findByPhone(phone) {
    return await queryRow(
      'SELECT id, name, email, phone, password, role, is_active, created_at FROM users WHERE phone = $1',
      [phone]
    );
  },

  // Find user by ID
  async findById(id) {
    return await queryRow(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
  },

  // Get all users
  async getAll() {
    return await queryRows(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
  },

  // Update user
  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await queryRow(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex} 
       RETURNING id, name, email, phone, role, is_active, updated_at`,
      values
    );
    return result;
  }
};

// Group operations
export const groupQueries = {
  // Create a new group
  async create({ name, description, createdBy }) {
    const result = await queryRow(
      `INSERT INTO groups (name, description, created_by) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, description, created_by, created_at`,
      [name, description, createdBy]
    );
    return result;
  },

  // Get group by ID
  async findById(id) {
    return await queryRow(
      'SELECT id, name, description, created_by, created_at FROM groups WHERE id = $1',
      [id]
    );
  },

  // Get all groups
  async getAll() {
    return await queryRows(
      'SELECT id, name, description, created_by, created_at FROM groups ORDER BY created_at DESC'
    );
  },

  // Add user to group
  async addMember(groupId, userId) {
    const result = await queryRow(
      `INSERT INTO group_members (group_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, group_id) DO NOTHING
       RETURNING id, group_id, user_id, joined_at`,
      [groupId, userId]
    );
    return result;
  },

  // Get group members
  async getMembers(groupId) {
    return await queryRows(
      `SELECT u.id, u.name, u.email, u.role, gm.joined_at
       FROM users u 
       JOIN group_members gm ON u.id = gm.user_id 
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at`,
      [groupId]
    );
  },

  // Check if user is member of group
  async getMembership(userId, groupId) {
    return await queryRow(
      `SELECT gm.id, gm.group_id, gm.user_id, gm.joined_at
       FROM group_members gm
       WHERE gm.user_id = $1 AND gm.group_id = $2`,
      [userId, groupId]
    );
  },

  // Update group timestamp (for when new messages are added)
  async updateTimestamp(groupId) {
    return await queryRow(
      `UPDATE groups 
       SET updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, updated_at`,
      [groupId]
    );
  }
};

// Message operations
export const messageQueries = {
  // Create a new message
  async create({ content, senderId, groupId = null, receiverId = null }) {
    const result = await queryRow(
      `INSERT INTO messages (content, sender_id, group_id, receiver_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, content, sender_id, group_id, receiver_id, created_at`,
      [content, senderId, groupId, receiverId]
    );
    return result;
  },

  // Get group messages
  async getGroupMessages(groupId, limit = 50, offset = 0) {
    return await queryRows(
      `SELECT m.id, m.content, m.sender_id, m.created_at,
              u.name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );
  },

  // Get direct messages between two users
  async getDirectMessages(userId1, userId2, limit = 50, offset = 0) {
    return await queryRows(
      `SELECT m.id, m.content, m.sender_id, m.receiver_id, m.created_at,
              u.name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId1, userId2, limit, offset]
    );
  }
};

// Private Notes operations
export const noteQueries = {
  // Create a new note
  async create({ title, content, authorId, relatedUserId = null, tags = [] }) {
    const result = await queryRow(
      `INSERT INTO private_notes (title, content, author_id, related_user_id, tags) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, title, content, author_id, related_user_id, tags, created_at`,
      [title, content, authorId, relatedUserId, tags]
    );
    return result;
  },

  // Get notes by author
  async getByAuthor(authorId) {
    return await queryRows(
      `SELECT pn.id, pn.title, pn.content, pn.related_user_id, pn.tags, pn.created_at,
              u.name as related_user_name
       FROM private_notes pn
       LEFT JOIN users u ON pn.related_user_id = u.id
       WHERE pn.author_id = $1
       ORDER BY pn.created_at DESC`,
      [authorId]
    );
  },

  // Get note by ID
  async findById(id) {
    return await queryRow(
      `SELECT pn.id, pn.title, pn.content, pn.author_id, pn.related_user_id, pn.tags, pn.created_at,
              u.name as related_user_name
       FROM private_notes pn
       LEFT JOIN users u ON pn.related_user_id = u.id
       WHERE pn.id = $1`,
      [id]
    );
  },

  // Update note
  async update(id, { title, content, tags }) {
    const result = await queryRow(
      `UPDATE private_notes 
       SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, title, content, tags, updated_at`,
      [title, content, tags, id]
    );
    return result;
  },

  // Delete note
  async delete(id) {
    const result = await query('DELETE FROM private_notes WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  // Get notes by user and agent
  async getByUserAndAgent(userId, agentId) {
    return await queryRows(
      `SELECT pn.id, pn.title, pn.content, pn.author_id, pn.related_user_id, pn.tags, pn.created_at, pn.updated_at,
              u.name as related_user_name,
              a.name as author_name
       FROM private_notes pn
       LEFT JOIN users u ON pn.related_user_id = u.id
       LEFT JOIN users a ON pn.author_id = a.id
       WHERE pn.related_user_id = $1 AND pn.author_id = $2
       ORDER BY pn.created_at DESC`,
      [userId, agentId]
    );
  }
};

// Admin operations
export const adminQueries = {
  // Find admin by username
  async findByUsername(username) {
    return await queryRow(
      'SELECT id, username, password, created_at FROM admins WHERE username = $1',
      [username]
    );
  },

  // Find admin by ID
  async findById(id) {
    return await queryRow(
      'SELECT id, username, password, created_at FROM admins WHERE id = $1',
      [id]
    );
  },

  // Create a new admin
  async create({ username, password }) {
    const result = await queryRow(
      `INSERT INTO admins (username, password) 
       VALUES ($1, $2) 
       RETURNING id, username, created_at`,
      [username, password]
    );
    return result;
  },

  // Get dashboard stats
  async getDashboardStats() {
    const stats = await queryRows(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'USER') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'AGENT') as total_agents,
        (SELECT COUNT(*) FROM users WHERE role = 'AGENT' AND is_active = false) as pending_agents,
        (SELECT COUNT(*) FROM groups) as total_groups,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM private_notes) as total_notes
    `);
    return stats[0];
  },

  // Get all users with pagination
  async getAllUsers(limit = 20, offset = 0, role = null) {
    let query_text = `
      SELECT id, name, email, phone, role, is_active, created_at 
      FROM users 
    `;
    let params = [];
    
    if (role) {
      query_text += ` WHERE role = $1 `;
      params.push(role);
      query_text += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query_text += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }
    
    return await queryRows(query_text, params);
  },

  // Approve/reject agent
  async updateUserStatus(userId, isActive) {
    const result = await queryRow(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, name, email, role, is_active, updated_at`,
      [isActive, userId]
    );
    return result;
  },

  // Update admin password
  async updatePassword(adminId, hashedPassword) {
    const result = await queryRow(
      `UPDATE admins SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, username, updated_at`,
      [hashedPassword, adminId]
    );
    return result;
  },

  // Delete user
  async deleteUser(userId) {
    // First delete related data (messages, notes, etc.)
    await queryRows('DELETE FROM messages WHERE sender_id = $1', [userId]);
    await queryRows('DELETE FROM private_notes WHERE author_id = $1 OR related_user_id = $1', [userId]);
    await queryRows('DELETE FROM group_members WHERE user_id = $1', [userId]);
    
    // Then delete the user
    const result = await queryRow(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [userId]
    );
    return result;
  }
};