/**
 * Input Validator for Security
 * Provides input validation, sanitization, and XSS protection
 */

class Validator {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 2000); // Limit length
  }

  /**
   * Validate and sanitize license key
   */
  static validateLicenseKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('License key is required');
    }

    const sanitized = key.trim();
    
    // License key format validation (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
      throw new Error('Invalid license key format');
    }

    if (sanitized.length < 10 || sanitized.length > 100) {
      throw new Error('License key must be between 10 and 100 characters');
    }

    return sanitized;
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    return email.trim().toLowerCase();
  }

  /**
   * Validate user ID (Discord snowflake)
   */
  static validateUserId(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const id = String(userId).trim();
    
    // Discord snowflake validation (17-19 digits)
    if (!/^\d{17,19}$/.test(id)) {
      throw new Error('Invalid user ID format');
    }

    return id;
  }

  /**
   * Validate integer with range
   */
  static validateInteger(value, min = null, max = null) {
    const num = parseInt(value, 10);
    
    if (isNaN(num)) {
      throw new Error('Invalid number');
    }

    if (min !== null && num < min) {
      throw new Error(`Value must be at least ${min}`);
    }

    if (max !== null && num > max) {
      throw new Error(`Value must be at most ${max}`);
    }

    return num;
  }

  /**
   * Sanitize SQL input (parameterized queries should be used, but this adds extra safety)
   */
  static sanitizeSQL(input) {
    if (typeof input !== 'string') return '';
    
    // Remove SQL injection patterns
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/gi, '')
      .replace(/sp_/gi, '')
      .trim();
  }

  /**
   * Validate URL
   */
  static validateURL(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required');
    }

    try {
      const parsed = new URL(url);
      
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }

      return parsed.href;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Validate period string
   */
  static validatePeriod(period) {
    const validPeriods = ['7d', '30d', '90d', '1y'];
    
    if (!validPeriods.includes(period)) {
      throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    return period;
  }

  /**
   * Sanitize text for display (prevent XSS in embeds)
   */
  static sanitizeForDisplay(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .replace(/[<>]/g, '')
      .replace(/&/g, '&amp;')
      .substring(0, 1024); // Discord embed field limit
  }
}

module.exports = Validator;

