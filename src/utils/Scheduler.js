/**
 * Scheduler for Discord Bot
 * Handles scheduled tasks and cron jobs
 */

const cron = require('node-cron');
const Logger = require('./Logger');

class Scheduler {
  constructor(client, licenseClient, dbManager) {
    this.client = client;
    this.licenseClient = licenseClient;
    this.dbManager = dbManager;
    this.logger = new Logger('Scheduler');
    this.tasks = [];
  }

  startScheduledTasks() {
    try {
      // Daily stats update (runs at midnight)
      const statsTask = cron.schedule('0 0 * * *', async () => {
        try {
          this.logger.info('Running daily stats update...');
          const stats = await this.dbManager.getBotStats();
          this.logger.info('Bot stats updated:', stats);
        } catch (error) {
          this.logger.error('Error updating stats:', error);
        }
      }, {
        scheduled: false
      });

      // Health check (runs every hour)
      const healthTask = cron.schedule('0 * * * *', async () => {
        try {
          this.logger.info('Running health check...');
          if (this.client.user) {
            this.logger.info(`Bot is healthy: ${this.client.user.tag}`);
          } else {
            this.logger.warn('Bot user not available');
          }
        } catch (error) {
          this.logger.error('Health check failed:', error);
        }
      }, {
        scheduled: false
      });

      // Start tasks
      statsTask.start();
      healthTask.start();

      this.tasks.push(statsTask, healthTask);
      this.logger.info(`Started ${this.tasks.length} scheduled tasks`);
    } catch (error) {
      this.logger.error('Failed to start scheduled tasks:', error);
      throw error;
    }
  }

  stopScheduledTasks() {
    try {
      this.tasks.forEach((task) => {
        task.stop();
      });
      this.tasks = [];
      this.logger.info('Stopped all scheduled tasks');
    } catch (error) {
      this.logger.error('Error stopping scheduled tasks:', error);
    }
  }
}

module.exports = Scheduler;

