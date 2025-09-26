/**
 * LicenseChain Discord Bot
 * Advanced Discord integration for license management
 */

const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const cron = require('node-cron');
const express = require('express');

// Import bot modules
const LicenseChainClient = require('./client/LicenseChainClient');
const CommandHandler = require('./handlers/CommandHandler');
const EventHandler = require('./handlers/EventHandler');
const DatabaseManager = require('./database/DatabaseManager');
const Scheduler = require('./utils/Scheduler');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ]
});

// Initialize bot components
const licenseClient = new LicenseChainClient({
  apiKey: process.env.LICENSE_CHAIN_API_KEY,
  baseUrl: process.env.LICENSE_CHAIN_API_URL || 'https://api.licensechain.app'
});

const dbManager = new DatabaseManager();
const commandHandler = new CommandHandler(client, licenseClient, dbManager);
const eventHandler = new EventHandler(client, licenseClient, dbManager);
const scheduler = new Scheduler(client, licenseClient, dbManager);

// Set up collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Bot ready event
client.once(Events.ClientReady, async () => {
  logger.info(`Discord bot logged in as ${client.user.tag}!`);
  
  // Set bot activity
  client.user.setActivity('LicenseChain Management', { type: ActivityType.Watching });
  
  // Initialize database
  await dbManager.initialize();
  
  // Load commands and events
  await commandHandler.loadCommands();
  await eventHandler.loadEvents();
  
  // Start scheduled tasks
  scheduler.startScheduledTasks();
  
  logger.info('LicenseChain Discord Bot is ready!');
});

// Error handling
client.on(Events.Error, error => {
  logger.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Health check server
const app = express();
const PORT = process.env.PORT || 3004;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bot: client.user ? 'online' : 'offline',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/stats', (req, res) => {
  res.json({
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    commands: client.commands.size,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.listen(PORT, () => {
  logger.info(`Health check server running on port ${PORT}`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down bot...');
  
  // Stop scheduled tasks
  scheduler.stopScheduledTasks();
  
  // Close database connections
  await dbManager.close();
  
  // Destroy Discord client
  client.destroy();
  
  process.exit(0);
});

module.exports = client;
