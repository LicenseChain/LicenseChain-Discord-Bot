/**
 * LicenseChain API Client for Discord Bot
 */

const axios = require('axios');
const crypto = require('crypto');

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
        'User-Agent': 'LicenseChain-Discord-Bot/1.0.0'
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
      const response = await this.client.post('/api/licenses/validate', {
        licenseKey,
        hardwareId: hardwareId || 'discord-bot'
      });
      return response.data;
    } catch (error) {
      throw new Error(`License validation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get license information
   */
  async getLicense(licenseId) {
    try {
      const response = await this.client.get(`/api/licenses/${licenseId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get license: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user licenses
   */
  async getUserLicenses(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}/licenses`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user licenses: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a new license
   */
  async createLicense(licenseData) {
    try {
      const response = await this.client.post('/api/licenses', licenseData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create license: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update license
   */
  async updateLicense(licenseId, updateData) {
    try {
      const response = await this.client.put(`/api/licenses/${licenseId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update license: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Revoke license
   */
  async revokeLicense(licenseId) {
    try {
      const response = await this.client.delete(`/api/licenses/${licenseId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to revoke license: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get license analytics
   */
  async getLicenseAnalytics(licenseId, period = '30d') {
    try {
      const response = await this.client.get(`/api/licenses/${licenseId}/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get license analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user information
   */
  async getUser(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create user
   */
  async createUser(userData) {
    try {
      const response = await this.client.post('/api/users', userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    try {
      const response = await this.client.put(`/api/users/${userId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get application information
   */
  async getApplication(appId) {
    try {
      const response = await this.client.get(`/api/applications/${appId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get application: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period = '30d', metrics = []) {
    try {
      const response = await this.client.get(`/api/analytics?period=${period}&metrics=${metrics.join(',')}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.response?.data?.message || error.message}`);
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
          'User-Agent': 'LicenseChain-Discord-Bot/1.0.0'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send webhook: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

module.exports = LicenseChainClient;
