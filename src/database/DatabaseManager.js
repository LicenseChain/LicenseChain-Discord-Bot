/**
 * Database Manager for Discord Bot
 * Uses Supabase/PostgreSQL tg_bot_* tables. Set DATABASE_URL to Postgres connection string.
 */

const { Pool } = require('pg');
const Logger = require('../utils/Logger');

const PREFIX = 'tg_bot_';

function getConnectionConfig() {
  const url = process.env.DATABASE_URL || '';
  if (!url || url.startsWith('sqlite') || url.endsWith('.db')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string (e.g. Supabase). SQLite is no longer supported.');
  }
  const opts = { connectionString: url };
  if (url.includes('pooler.supabase.com') || url.includes(':6543')) {
    if (!url.includes('pgbouncer=true')) opts.connectionString += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    opts.ssl = { rejectUnauthorized: false };
  }
  return opts;
}

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.logger = new Logger('DatabaseManager');
    this.platform = 'discord';
    this.platformIdColumn = 'discord_id';
  }

  async initialize() {
    try {
      const config = getConnectionConfig();
      this.pool = new Pool(config);
      await this.pool.query('SELECT 1');
      this.logger.info('Database connected (PostgreSQL tg_bot_* tables)');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      return false;
    }
  }

  async _resolveUserId(platformUserId) {
    const id = platformUserId == null ? null : String(platformUserId);
    if (id === null || id === '') return null;
    const r = await this.pool.query(
      `SELECT id FROM ${PREFIX}users WHERE ${this.platformIdColumn} = $1`,
      [id]
    );
    return r.rows[0] ? r.rows[0].id : null;
  }

  async getUser(discordId) {
    const id = String(discordId);
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}users WHERE ${this.platformIdColumn} = $1`,
      [id]
    );
    return r.rows[0] ? this._rowUser(r.rows[0]) : null;
  }

  _rowUser(row) {
    return {
      id: row.id,
      discord_id: row.discord_id,
      username: row.username,
      discriminator: row.discriminator,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async createUser(userData) {
    const r = await this.pool.query(
      `INSERT INTO ${PREFIX}users (discord_id, username, discriminator)
       VALUES ($1, $2, $3)
       RETURNING id, discord_id, username, discriminator, created_at, updated_at`,
      [String(userData.id), userData.username || null, userData.discriminator != null ? String(userData.discriminator) : null]
    );
    const row = r.rows[0];
    return { id: row.id, ...userData };
  }

  async getOrCreateUser(userData) {
    let user = await this.getUser(userData.id);
    if (!user) user = await this.createUser(userData);
    return user;
  }

  async getUserLicenses(discordId) {
    const userId = await this._resolveUserId(discordId);
    if (userId == null) return [];
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}licenses WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return r.rows.map(row => ({
      key: row.license_key,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      applicationName: 'LicenseChain',
      plan: 'standard',
      expiresAt: null
    }));
  }

  async logCommand(platformUserId, command) {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) return;
    await this.pool.query(
      `INSERT INTO ${PREFIX}commands (user_id, command) VALUES ($1, $2)`,
      [userId, command]
    );
  }

  async logValidation(platformUserId, licenseKey, isValid) {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) return;
    await this.pool.query(
      `INSERT INTO ${PREFIX}validations (user_id, license_key, is_valid) VALUES ($1, $2, $3)`,
      [userId, licenseKey, isValid ? 1 : 0]
    );
  }

  async getValidationCount(platformUserId = null, startDate = null) {
    let query = `SELECT COUNT(*)::int AS count FROM ${PREFIX}validations`;
    const params = [];
    if (platformUserId != null) {
      const userId = await this._resolveUserId(platformUserId);
      if (userId == null) return 0;
      query += ' WHERE user_id = $1';
      params.push(userId);
    }
    if (startDate) {
      query += (params.length ? ' AND' : ' WHERE') + ' created_at >= $' + (params.length + 1);
      params.push(startDate);
    }
    const r = await this.pool.query(query, params);
    return r.rows[0] ? r.rows[0].count : 0;
  }

  async getUserUsageStats(platformUserId, period = '30d') {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) {
      return {
        totalValidations: 0,
        activeLicenses: 0,
        mostUsedLicense: 'N/A',
        averageDaily: 0,
        peakDay: 'N/A',
        trend: 'Stable',
        licenseBreakdown: []
      };
    }
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setDate(now.getDate() - 30);
    }
    const totalValidations = await this.getValidationCount(platformUserId, startDate);
    const countDistinct = await this.pool.query(
      `SELECT COUNT(DISTINCT license_key)::int AS count FROM ${PREFIX}validations WHERE user_id = $1 AND created_at >= $2`,
      [userId, startDate]
    );
    const mostUsed = await this.pool.query(
      `SELECT license_key, COUNT(*) AS count FROM ${PREFIX}validations
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY license_key ORDER BY count DESC LIMIT 1`,
      [userId, startDate]
    );
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const averageDaily = totalValidations / days;
    return {
      totalValidations,
      activeLicenses: countDistinct.rows[0]?.count ?? 0,
      mostUsedLicense: mostUsed.rows[0] ? mostUsed.rows[0].license_key : 'N/A',
      averageDaily: Math.round(averageDaily * 100) / 100,
      peakDay: 'N/A',
      trend: 'Stable',
      licenseBreakdown: []
    };
  }

  async getUserSettings(platformUserId) {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) {
      return {
        user_id: platformUserId,
        notifications_enabled: 1,
        analytics_enabled: 1,
        language: 'en'
      };
    }
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}user_settings WHERE user_id = $1`,
      [userId]
    );
    const row = r.rows[0];
    if (!row) {
      return { user_id: platformUserId, notifications_enabled: 1, analytics_enabled: 1, language: 'en' };
    }
    return {
      user_id: platformUserId,
      notifications_enabled: row.notifications_enabled,
      analytics_enabled: row.analytics_enabled,
      language: row.language || 'en'
    };
  }

  async updateUserSettings(platformUserId, settings) {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) return { changes: 0 };
    const r = await this.pool.query(
      `SELECT id FROM ${PREFIX}user_settings WHERE user_id = $1`,
      [userId]
    );
    const notif = settings.notifications_enabled !== undefined ? (settings.notifications_enabled ? 1 : 0) : undefined;
    const analytics = settings.analytics_enabled !== undefined ? (settings.analytics_enabled ? 1 : 0) : undefined;
    const lang = settings.language !== undefined ? settings.language : undefined;
    if (r.rows[0]) {
      const updates = [];
      const vals = [];
      let i = 1;
      if (notif !== undefined) { updates.push(`notifications_enabled = $${i++}`); vals.push(notif); }
      if (analytics !== undefined) { updates.push(`analytics_enabled = $${i++}`); vals.push(analytics); }
      if (lang !== undefined) { updates.push(`language = $${i++}`); vals.push(lang); }
      if (updates.length === 0) return { changes: 0 };
      vals.push(userId);
      const u = await this.pool.query(
        `UPDATE ${PREFIX}user_settings SET ${updates.join(', ')}, updated_at = now() WHERE user_id = $${i}`,
        vals
      );
      return { changes: u.rowCount };
    }
    await this.pool.query(
      `INSERT INTO ${PREFIX}user_settings (user_id, notifications_enabled, analytics_enabled, language)
       VALUES ($1, $2, $3, $4)`,
      [userId, notif !== undefined ? notif : 1, analytics !== undefined ? analytics : 1, lang || 'en']
    );
    return { id: 1 };
  }

  async updateUser(discordId, userData) {
    const updates = [];
    const values = [];
    if (userData.username !== undefined) { updates.push('username = $' + (values.length + 1)); values.push(userData.username); }
    if (userData.discriminator !== undefined) { updates.push('discriminator = $' + (values.length + 1)); values.push(String(userData.discriminator)); }
    if (updates.length === 0) return { changes: 0 };
    values.push(String(discordId));
    const r = await this.pool.query(
      `UPDATE ${PREFIX}users SET ${updates.join(', ')}, updated_at = now() WHERE ${this.platformIdColumn} = $${values.length}`,
      values
    );
    return { changes: r.rowCount };
  }

  async getBotStats() {
    const [users, licenses, commands] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ${PREFIX}users`),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ${PREFIX}licenses`),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ${PREFIX}commands`)
    ]);
    return {
      totalUsers: users.rows[0]?.c ?? 0,
      totalLicenses: licenses.rows[0]?.c ?? 0,
      totalCommands: commands.rows[0]?.c ?? 0
    };
  }

  async createTicket(internalUserId, subject, description) {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const r = await this.pool.query(
      `INSERT INTO ${PREFIX}tickets (ticket_id, user_id, subject, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, ticket_id, user_id, subject, description, status`,
      [ticketId, internalUserId, subject, description]
    );
    const row = r.rows[0];
    return { id: row.id, ticketId, userId: internalUserId, subject, description, status: 'open' };
  }

  async getTickets(platformUserId) {
    const userId = await this._resolveUserId(platformUserId);
    if (userId == null) return [];
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}tickets WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return r.rows.map(this._rowTicket);
  }

  _rowTicket(row) {
    return {
      id: row.id,
      ticket_id: row.ticket_id,
      user_id: row.user_id,
      subject: row.subject,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async getTicket(ticketId) {
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}tickets WHERE ticket_id = $1`,
      [ticketId]
    );
    const row = r.rows[0];
    return row ? this._rowTicket(row) : null;
  }

  async updateTicketStatus(ticketId, status) {
    const r = await this.pool.query(
      `UPDATE ${PREFIX}tickets SET status = $1, updated_at = now() WHERE ticket_id = $2`,
      [status, ticketId]
    );
    return { changes: r.rowCount };
  }

  async getAllTickets() {
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}tickets ORDER BY created_at DESC`
    );
    return r.rows.map(this._rowTicket);
  }

  async getBotStatus() {
    const r = await this.pool.query(
      `SELECT status FROM ${PREFIX}bot_status ORDER BY updated_at DESC LIMIT 1`
    );
    return r.rows[0] ? r.rows[0].status : 'online';
  }

  async setBotStatus(status, updatedBy) {
    await this.pool.query(`DELETE FROM ${PREFIX}bot_status`);
    await this.pool.query(
      `INSERT INTO ${PREFIX}bot_status (status, updated_by) VALUES ($1, $2)`,
      [status, updatedBy != null ? String(updatedBy) : null]
    );
    return { status, updatedBy };
  }

  async getAllUsers() {
    const r = await this.pool.query(
      `SELECT * FROM ${PREFIX}users ORDER BY created_at DESC`
    );
    return r.rows.map(row => this._rowUser(row));
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.logger.info('Database connection closed');
    }
  }
}

module.exports = DatabaseManager;
