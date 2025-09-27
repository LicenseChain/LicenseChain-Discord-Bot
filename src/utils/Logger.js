const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        return JSON.stringify(logEntry);
    }

    writeToFile(level, message, data = null) {
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        const formattedMessage = this.formatMessage(level, message, data);
        
        fs.appendFileSync(logFile, formattedMessage + '\n');
    }

    info(message, data = null) {
        console.log(`[INFO] ${message}`, data || '');
        this.writeToFile('INFO', message, data);
    }

    warn(message, data = null) {
        console.warn(`[WARN] ${message}`, data || '');
        this.writeToFile('WARN', message, data);
    }

    error(message, data = null) {
        console.error(`[ERROR] ${message}`, data || '');
        this.writeToFile('ERROR', message, data);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, data || '');
            this.writeToFile('DEBUG', message, data);
        }
    }

    success(message, data = null) {
        console.log(`[SUCCESS] ${message}`, data || '');
        this.writeToFile('SUCCESS', message, data);
    }
}

module.exports = new Logger();
