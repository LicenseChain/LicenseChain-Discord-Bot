/**
 * LicenseChain API Client for Discord Bot
 */

const axios = require('axios');
const crypto = require('crypto');
const { normalizeAxiosError, normalizeVerifyPayload } = require('./licensechainApiNormalize');
const { getLinkedUser } = require('./DashboardClient');

class LicenseChainClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `LicenseChain-Discord-Bot/${process.env.LICENSECHAIN_APP_VERSION || '1.0.0'}`
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making request to ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate a license key
   */
  async validateLicense(licenseKey, hardwareId = null) {
    try {
      // Use /v1/licenses/verify endpoint with 'key' parameter to match API
      const response = await this.client.post('/v1/licenses/verify', {
        key: licenseKey,
        hardwareId: hardwareId || 'discord-bot'
      });
      return normalizeVerifyPayload(response.data);
    } catch (error) {
      throw normalizeAxiosError(error, 'License validation failed');
    }
  }

  /**
   * Get license information by key (via verification endpoint)
   */
  async getLicense(licenseKey) {
    try {
      // Use verify endpoint to get license info
      const response = await this.client.post('/v1/licenses/verify', { key: licenseKey });
      return normalizeVerifyPayload(response.data);
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get license');
    }
  }

  /**
   * Get user licenses (filtered from app licenses by email/issuedTo)
   * Note: API doesn't have a direct user licenses endpoint, so we filter app licenses
   */
  async getUserLicenses(userId) {
    try {
      const linked = await getLinkedUser(userId);
      const linkedEmail = (linked?.email || '').trim().toLowerCase();
      if (!linkedEmail) {
        throw new Error('DISCORD_ACCOUNT_NOT_LINKED');
      }

      // Get all app licenses and filter by user
      const appName = process.env.LICENSECHAIN_APP_NAME;
      if (!appName) {
        throw new Error('LICENSECHAIN_APP_NAME not configured');
      }
      
      let appId = appName;
      try {
        const app = await this.getAppByName(appName);
        if (app && app.id) {
          appId = app.id;
        }
      } catch (appError) {
        console.warn('Could not fetch app info:', appError.message);
      }
      
      const licensesData = await this.getAppLicenses(appId);
      const allLicenses = licensesData?.licenses || licensesData || [];
      
      // Scope licenses by linked dashboard email to avoid discord-id/email drift.
      return allLicenses.filter(license => {
        const issuedEmail = (license?.issuedEmail || '').trim().toLowerCase();
        const email = (license?.email || '').trim().toLowerCase();
        return issuedEmail === linkedEmail || email === linkedEmail;
      });
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get user licenses');
    }
  }

  /**
   * Create a new license
   * @param {string} appId - The application ID
   * @param {object} licenseData - License data (plan, expiresAt, etc.)
   */
  async createLicense(appId, licenseData) {
    try {
      const response = await this.client.post(`/v1/apps/${appId}/licenses`, licenseData);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to create license');
    }
  }

  /**
   * Update license (supports both ID and licenseKey)
   */
  async updateLicense(licenseId, updateData) {
    try {
      // API v1 exposes explicit status endpoints
      if (updateData.status && Object.keys(updateData).length === 1) {
        if (updateData.status === 'revoked') {
          const response = await this.client.patch(`/v1/licenses/${licenseId}/revoke`, {});
          return response.data;
        }
        if (updateData.status === 'active') {
          const response = await this.client.patch(`/v1/licenses/${licenseId}/activate`, {});
          return response.data;
        }
        const response = await this.client.patch(`/v1/licenses/${licenseId}`, updateData);
        return response.data;
      }
      
      // For other updates (like expiresAt, plan, issuedTo, issuedEmail), use the general update endpoint
      const response = await this.client.patch(`/v1/licenses/${licenseId}`, updateData);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to update license');
    }
  }

  /**
   * Revoke license (supports both ID and licenseKey)
   */
  async revokeLicense(licenseId) {
    try {
      const response = await this.client.patch(`/v1/licenses/${licenseId}/revoke`, {});
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to revoke license');
    }
  }

  /**
   * Get license analytics
   */
  async getLicenseAnalytics(licenseId, period = '30d') {
    try {
      const response = await this.client.get(`/v1/licenses/${licenseId}/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get license analytics');
    }
  }

  /**
   * Get user information
   * Note: API doesn't have a direct user endpoint, returns null to use local DB
   */
  async getUser(userId) {
    try {
      // API doesn't have user endpoints, return null to use local database
      // This allows the /user command to fall back to local DB
      return null;
    } catch (error) {
      // Return null on error to allow fallback to local DB
      return null;
    }
  }

  /**
   * Create user
   */
  async createUser(userData) {
    try {
      const payload = {
        email: userData.email,
        name: userData.name,
        password: userData.password || 'discord-bot-default-password'
      };
      const response = await this.client.post('/v1/auth/register', payload);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to create user');
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    throw new Error('updateUser is not available in API v1');
  }

  /**
   * Get application information
   */
  async getApplication(appId) {
    try {
      const response = await this.client.get(`/v1/apps/${appId}`);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get application');
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period = '30d', metrics = []) {
    try {
      const response = await this.client.get(`/v1/analytics/stats?period=${period}&metrics=${metrics.join(',')}`);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get analytics');
    }
  }

  /**
   * Get licenses for an app
   */
  async getAppLicenses(appId) {
    try {
      const response = await this.client.get(`/v1/apps/${appId}/licenses`);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get app licenses');
    }
  }

  /**
   * Get app by name or slug
   */
  async getAppByName(appName) {
    try {
      const response = await this.client.get('/v1/apps');
      const apps = response.data?.apps || response.data || [];
      // Try to find by name, slug, or id
      return apps.find(app => 
        app.name === appName || 
        app.slug === appName || 
        app.id === appName
      );
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get app');
    }
  }

  /**
   * Get all licenses (for authenticated user's apps)
   */
  async getAllLicenses() {
    try {
      const response = await this.client.get('/v1/apps');
      const apps = response.data?.apps || response.data || [];
      let allLicenses = [];
      
      // Fetch licenses for each app
      for (const app of apps) {
        try {
          const licensesData = await this.getAppLicenses(app.id);
          const licenses = licensesData?.licenses || licensesData || [];
          allLicenses = allLicenses.concat(licenses);
        } catch (err) {
          // Continue if one app fails
          console.error(`Failed to get licenses for app ${app.id}:`, err.message);
        }
      }
      
      return allLicenses;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to get all licenses');
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(webhookUrl, data) {
    try {
      const response = await axios.post(webhookUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `LicenseChain-Discord-Bot/${process.env.LICENSECHAIN_APP_VERSION || '1.0.0'}`
        }
      });
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Failed to send webhook');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    if (!payload || !signature || !secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const received = String(signature).startsWith('sha256=') ? String(signature).slice(7) : String(signature);
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(received, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/v1/health');
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, 'Health check failed');
    }
  }
}

module.exports = LicenseChainClient;
