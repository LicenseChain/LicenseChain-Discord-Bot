const fs = require('fs');
const path = require('path');

class Logger {
    constructor(module = 'App') {
        this.module = module;
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';
        
        return `[${timestamp}] [${level.toUpperCase()}] [${this.module}] ${message}${formattedArgs}`;
    }

    writeToFile(level, message, ...args) {
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        const formattedMessage = this.formatMessage(level, message, ...args);
        
        try {
            fs.appendFileSync(logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    debug(message, ...args) {
        const formattedMessage = this.formatMessage('debug', message, ...args);
        console.debug(formattedMessage);
        this.writeToFile('debug', message, ...args);
    }

    info(message, ...args) {
        const formattedMessage = this.formatMessage('info', message, ...args);
        console.info(formattedMessage);
        this.writeToFile('info', message, ...args);
    }

    warn(message, ...args) {
        const formattedMessage = this.formatMessage('warn', message, ...args);
        console.warn(formattedMessage);
        this.writeToFile('warn', message, ...args);
    }

    error(message, ...args) {
        const formattedMessage = this.formatMessage('error', message, ...args);
        console.error(formattedMessage);
        this.writeToFile('error', message, ...args);
    }

    fatal(message, ...args) {
        const formattedMessage = this.formatMessage('fatal', message, ...args);
        console.error(formattedMessage);
        this.writeToFile('fatal', message, ...args);
    }

    success(message, ...args) {
        const formattedMessage = this.formatMessage('success', message, ...args);
        console.log(formattedMessage);
        this.writeToFile('success', message, ...args);
    }

    // Utility methods
    clearLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            files.forEach(file => {
                if (file.endsWith('.log')) {
                    fs.unlinkSync(path.join(this.logDir, file));
                }
            });
            this.info('Log files cleared');
        } catch (error) {
            this.error('Failed to clear log files:', error);
        }
    }

    getLogFiles() {
        try {
            return fs.readdirSync(this.logDir)
                .filter(file => file.endsWith('.log'))
                .map(file => path.join(this.logDir, file));
        } catch (error) {
            this.error('Failed to get log files:', error);
            return [];
        }
    }

    getLogFileSize() {
        try {
            const files = this.getLogFiles();
            return files.reduce((total, file) => {
                const stats = fs.statSync(file);
                return total + stats.size;
            }, 0);
        } catch (error) {
            this.error('Failed to get log file size:', error);
            return 0;
        }
    }

    rotateLogs(maxSize = 10 * 1024 * 1024) {
        try {
            const files = this.getLogFiles();
            files.forEach(file => {
                const stats = fs.statSync(file);
                if (stats.size > maxSize) {
                    const backupFile = file + '.backup';
                    if (fs.existsSync(backupFile)) {
                        fs.unlinkSync(backupFile);
                    }
                    fs.renameSync(file, backupFile);
                    this.info(`Rotated log file: ${path.basename(file)}`);
                }
            });
        } catch (error) {
            this.error('Failed to rotate log files:', error);
        }
    }
}

module.exports = Logger;
