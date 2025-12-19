/**
 * Database Manager for Discord Bot
 * Handles database operations and connections
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const Logger = require('../utils/Logger');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.logger = new Logger('DatabaseManager');
    this.dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../data/bot.db');
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          this.logger.error('Error opening database:', err);
          throw err;
        }
        this.logger.info(`Database connected: ${this.dbPath}`);
      });

      // Create tables
      await this.createTables();

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          discord_id TEXT UNIQUE NOT NULL,
          username TEXT,
          discriminator TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS licenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          license_key TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS commands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          command TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS bot_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_users INTEGER DEFAULT 0,
          total_licenses INTEGER DEFAULT 0,
          total_commands INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'open',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS bot_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          status TEXT DEFAULT 'online',
          updated_by TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          notifications_enabled INTEGER DEFAULT 1,
          analytics_enabled INTEGER DEFAULT 1,
          language TEXT DEFAULT 'en',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS validations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          license_key TEXT NOT NULL,
          is_valid INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`
      ];

      let completed = 0;
      queries.forEach((query) => {
        this.db.run(query, (err) => {
          if (err) {
            this.logger.error('Error creating table:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === queries.length) {
            this.logger.info('Database tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  async getUser(discordId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE discord_id = ?',
        [discordId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async createUser(userData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO users (discord_id, username, discriminator)
         VALUES (?, ?, ?)`,
        [userData.id, userData.username, userData.discriminator],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...userData });
          }
        }
      );
    });
  }

  async getOrCreateUser(userData) {
    let user = await this.getUser(userData.id);
    if (!user) {
      user = await this.createUser(userData);
    }
    return user;
  }

  async getUserLicenses(discordId) {
    return new Promise((resolve, reject) => {
      // First get the user
      this.getUser(discordId)
        .then(user => {
          if (!user) {
            resolve([]);
            return;
          }

          // Get licenses for this user
          this.db.all(
            'SELECT * FROM licenses WHERE user_id = ? ORDER BY created_at DESC',
            [user.id],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                // Format licenses for return
                const licenses = rows.map(row => ({
                  key: row.license_key,
                  status: row.status,
                  createdAt: row.created_at,
                  updatedAt: row.updated_at,
                  applicationName: 'LicenseChain', // Default, can be enhanced
                  plan: 'standard', // Default, can be enhanced
                  expiresAt: null // Can be enhanced with additional fields
                }));
                resolve(licenses);
              }
            }
          );
        })
        .catch(reject);
    });
  }

  async logCommand(userId, command) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO commands (user_id, command) VALUES (?, ?)',
        [userId, command],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async logValidation(userId, licenseKey, isValid) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO validations (user_id, license_key, is_valid) VALUES (?, ?, ?)',
        [userId, licenseKey, isValid ? 1 : 0],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getValidationCount(userId = null, startDate = null) {
    return new Promise((resolve, reject) => {
      let query = userId 
        ? 'SELECT COUNT(*) as count FROM validations WHERE user_id = ?'
        : 'SELECT COUNT(*) as count FROM validations';
      const params = userId ? [userId] : [];
      
      if (startDate) {
        query += userId ? ' AND created_at >= ?' : ' WHERE created_at >= ?';
        params.push(startDate.toISOString());
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  async getUserUsageStats(userId, period = '30d') {
    return new Promise((resolve, reject) => {
      // Calculate start date based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get total validations for the period
      this.getValidationCount(userId, startDate)
        .then(totalValidations => {
          // Get active licenses count (simplified - you may want to enhance this)
          this.db.get(
            'SELECT COUNT(DISTINCT license_key) as count FROM validations WHERE user_id = ? AND created_at >= ?',
            [userId, startDate.toISOString()],
            (err, row) => {
              if (err) {
                reject(err);
                return;
              }

              const activeLicenses = row ? row.count : 0;

              // Get most used license
              this.db.get(
                `SELECT license_key, COUNT(*) as count 
                 FROM validations 
                 WHERE user_id = ? AND created_at >= ? 
                 GROUP BY license_key 
                 ORDER BY count DESC 
                 LIMIT 1`,
                [userId, startDate.toISOString()],
                (err, licenseRow) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
                  const averageDaily = totalValidations / days;

                  resolve({
                    totalValidations,
                    activeLicenses,
                    mostUsedLicense: licenseRow ? licenseRow.license_key : 'N/A',
                    averageDaily: Math.round(averageDaily * 100) / 100,
                    peakDay: 'N/A', // Could be enhanced with date grouping
                    trend: 'Stable', // Could be enhanced with comparison
                    licenseBreakdown: [] // Could be enhanced with detailed breakdown
                  });
                }
              );
            }
          );
        })
        .catch(reject);
    });
  }

  async getUserSettings(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || {
              user_id: userId,
              notifications_enabled: 1,
              analytics_enabled: 1,
              language: 'en'
            });
          }
        }
      );
    });
  }

  async updateUserSettings(userId, settings) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM user_settings WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            const updates = [];
            const values = [];
            if (settings.notifications_enabled !== undefined) {
              updates.push('notifications_enabled = ?');
              values.push(settings.notifications_enabled ? 1 : 0);
            }
            if (settings.analytics_enabled !== undefined) {
              updates.push('analytics_enabled = ?');
              values.push(settings.analytics_enabled ? 1 : 0);
            }
            if (settings.language !== undefined) {
              updates.push('language = ?');
              values.push(settings.language);
            }
            values.push(userId);

            this.db.run(
              `UPDATE user_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
              values,
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve({ changes: this.changes });
                }
              }
            );
          } else {
            this.db.run(
              `INSERT INTO user_settings (user_id, notifications_enabled, analytics_enabled, language)
               VALUES (?, ?, ?, ?)`,
              [
                userId,
                settings.notifications_enabled !== undefined ? (settings.notifications_enabled ? 1 : 0) : 1,
                settings.analytics_enabled !== undefined ? (settings.analytics_enabled ? 1 : 0) : 1,
                settings.language || 'en'
              ],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve({ id: this.lastID });
                }
              }
            );
          }
        }
      );
    });
  }

  async updateUser(userId, userData) {
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      if (userData.username !== undefined) {
        updates.push('username = ?');
        values.push(userData.username);
      }
      if (userData.discriminator !== undefined) {
        updates.push('discriminator = ?');
        values.push(userData.discriminator);
      }
      
      if (updates.length === 0) {
        resolve({ changes: 0 });
        return;
      }
      
      values.push(userId);
      
      this.db.run(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ?`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async getBotStats() {
    return new Promise((resolve, reject) => {
      Promise.all([
        new Promise((res, rej) => {
          this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (err) rej(err);
            else res(row.count);
          });
        }),
        new Promise((res, rej) => {
          this.db.get('SELECT COUNT(*) as count FROM licenses', (err, row) => {
            if (err) rej(err);
            else res(row.count);
          });
        }),
        new Promise((res, rej) => {
          this.db.get('SELECT COUNT(*) as count FROM commands', (err, row) => {
            if (err) rej(err);
            else res(row.count);
          });
        })
      ])
        .then(([totalUsers, totalLicenses, totalCommands]) => {
          resolve({
            totalUsers,
            totalLicenses,
            totalCommands
          });
        })
        .catch(reject);
    });
  }

  async createTicket(userId, subject, description) {
    return new Promise((resolve, reject) => {
      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      this.db.run(
        `INSERT INTO tickets (ticket_id, user_id, subject, description)
         VALUES (?, ?, ?, ?)`,
        [ticketId, userId, subject, description],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ticketId, userId, subject, description, status: 'open' });
          }
        }
      );
    });
  }

  async getTickets(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async getTicket(ticketId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM tickets WHERE ticket_id = ?',
        [ticketId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async updateTicketStatus(ticketId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?',
        [status, ticketId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async getAllTickets() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tickets ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async getBotStatus() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM bot_status ORDER BY updated_at DESC LIMIT 1',
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.status : 'online');
          }
        }
      );
    });
  }

  async setBotStatus(status, updatedBy) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM bot_status',
        [],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          this.db.run(
            'INSERT INTO bot_status (status, updated_by) VALUES (?, ?)',
            [status, updatedBy],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: this.lastID, status, updatedBy });
              }
            }
          );
        }
      );
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            this.logger.error('Error closing database:', err);
            reject(err);
          } else {
            this.logger.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = DatabaseManager;

