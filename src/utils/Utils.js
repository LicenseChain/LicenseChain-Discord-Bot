const crypto = require('crypto');

class Utils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateLicenseKey(licenseKey) {
        return licenseKey.length === 32 && /^[A-Z0-9]+$/.test(licenseKey);
    }

    static validateUuid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    static generateLicenseKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    static generateUuid() {
        return crypto.randomUUID();
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return String(input);
        }
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    static formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days}d ${hours}h`;
        }
    }

    static capitalizeFirst(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    static toSnakeCase(text) {
        return text.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    static toPascalCase(text) {
        return text.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    }

    static truncateString(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength - 3) + '...';
    }

    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    static createWebhookSignature(payload, secret) {
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    static verifyWebhookSignature(payload, signature, secret) {
        const expectedSignature = this.createWebhookSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const attempt = async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    attempts++;
                    if (attempts >= maxRetries) {
                        reject(error);
                    } else {
                        setTimeout(attempt, initialDelay * Math.pow(2, attempts - 1));
                    }
                }
            };
            
            attempt();
        });
    }

    static formatTimestamp(timestamp) {
        return new Date(timestamp * 1000).toISOString();
    }

    static parseTimestamp(timestamp) {
        return Math.floor(new Date(timestamp).getTime() / 1000);
    }

    static getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    static getCurrentDate() {
        return new Date().toISOString();
    }

    static sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    static sha1(data) {
        return crypto.createHash('sha1').update(data).digest('hex');
    }

    static md5(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    static base64Encode(data) {
        return Buffer.from(data).toString('base64');
    }

    static base64Decode(data) {
        return Buffer.from(data, 'base64').toString('utf8');
    }

    static isValidJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch {
            return false;
        }
    }

    static isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    }

    static chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const [key, value] of Object.entries(source)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this.deepMerge(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    static flattenObject(obj, separator = '.') {
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const flattened = this.flattenObject(value, separator);
                for (const [subKey, subValue] of Object.entries(flattened)) {
                    result[`${key}${separator}${subKey}`] = subValue;
                }
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    static unflattenObject(obj, separator = '.') {
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const keys = key.split(separator);
            let current = result;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
        }
        
        return result;
    }

    static generateRandomString(length, characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    static generateRandomBytes(length) {
        return crypto.randomBytes(length);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

module.exports = Utils;
