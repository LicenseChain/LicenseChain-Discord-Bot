/**
 * Permission Manager for Discord Bot
 * Handles role-based access control (User, Admin, Owner)
 */

const Logger = require('./Logger');
const logger = new Logger('PermissionManager');

class PermissionManager {
  constructor(client) {
    this.client = client;
    this.ownerId = process.env.BOT_OWNER_ID || null;
    this.adminRoleIds = (process.env.ADMIN_ROLE_IDS || '').split(',').filter(id => id.trim());
  }

  /**
   * Check if user is the bot owner
   */
  isOwner(userId) {
    if (!this.ownerId) {
      logger.warn('BOT_OWNER_ID not configured');
      return false;
    }
    return userId === this.ownerId;
  }

  /**
   * Check if user is an admin (Discord Administrator permission or custom admin role)
   */
  async isAdmin(member) {
    if (!member) return false;

    // Check Discord Administrator permission
    if (member.permissions.has('Administrator')) {
      return true;
    }

    // Check custom admin roles
    if (this.adminRoleIds.length > 0 && member.roles) {
      const memberRoleIds = member.roles.cache.map(role => role.id);
      return this.adminRoleIds.some(adminRoleId => memberRoleIds.includes(adminRoleId));
    }

    return false;
  }

  /**
   * Check if user is a regular user (not admin or owner)
   */
  async isUser(member) {
    if (!member) return false;
    const isAdminUser = await this.isAdmin(member);
    const isOwnerUser = this.isOwner(member.user.id);
    return !isAdminUser && !isOwnerUser;
  }

  /**
   * Get user role level (owner > admin > user)
   */
  async getUserRole(member) {
    if (!member) return 'user';

    if (this.isOwner(member.user.id)) {
      return 'owner';
    }

    if (await this.isAdmin(member)) {
      return 'admin';
    }

    return 'user';
  }

  /**
   * Check if user has required permission level
   */
  async hasPermission(member, requiredLevel) {
    if (!member) return false;

    const userRole = await this.getUserRole(member);

    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'owner': 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredLevel];
  }

  /**
   * Require permission level - throws error if user doesn't have permission
   */
  async requirePermission(member, requiredLevel) {
    const hasPermission = await this.hasPermission(member, requiredLevel);
    
    if (!hasPermission) {
      const userRole = await this.getUserRole(member);
      throw new Error(`Insufficient permissions. Required: ${requiredLevel}, Your role: ${userRole}`);
    }

    return true;
  }
}

module.exports = PermissionManager;

