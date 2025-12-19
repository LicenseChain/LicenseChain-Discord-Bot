# LicenseChain Discord Bot

[![License](https://img.shields.io/badge/license-ELASTIC2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14+-blue.svg)](https://discord.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5+-blue.svg)](https://www.typescriptlang.org/)

Official Discord Bot for LicenseChain - License management and customer support through Discord.

## ðŸš€ Features

- **ðŸ” License Management** - Validate, create, and manage licenses
- **ðŸ‘¤ User Support** - Handle customer inquiries and support tickets
- **ðŸ“Š Analytics** - View usage statistics and performance metrics
- **ðŸ”” Notifications** - Real-time license events and alerts
- **ðŸŽ« Ticket System** - Create and manage support tickets
- **ðŸ“ˆ Reporting** - Generate reports and analytics
- **ðŸ›¡ï¸ Security** - Secure authentication and authorization
- **ðŸ› ï¸ Easy Setup** - Simple configuration and deployment

## ðŸ“¦ Installation

### Method 1: npm (Recommended)

```bash
# Clone the repository
git clone https://github.com/LicenseChain/LicenseChain-Discord-Bot.git
cd LicenseChain-Discord-Bot

# Install dependencies
npm install

# Start the bot
npm start
```

### Method 2: Docker

```bash
# Build the Docker image
docker build -t licensechain-discord-bot .

# Run the container
docker run -p 3000:3000 licensechain-discord-bot
```

### Method 3: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/LicenseChain/LicenseChain-Discord-Bot/releases)
2. Extract to your project directory
3. Install dependencies: `npm install`
4. Configure environment variables
5. Start the bot: `npm start`

## ðŸš€ Quick Start

### Basic Setup

```bash
# Clone the repository
git clone https://github.com/LicenseChain/LicenseChain-Discord-Bot.git
cd LicenseChain-Discord-Bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start the bot
npm start
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Discord Configuration
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_GUILD_ID=your-discord-guild-id

# LicenseChain API
LICENSECHAIN_API_KEY=your-api-key
LICENSECHAIN_APP_NAME=your-app-name
LICENSECHAIN_APP_VERSION=1.0.0
LICENSECHAIN_BASE_URL=https://api.licensechain.app

# Bot Configuration
BOT_PREFIX=!
BOT_OWNER_ID=your-discord-user-id
BOT_DEBUG=false

# Database Configuration
DATABASE_URL=your-database-url

# Webhook Configuration
WEBHOOK_URL=your-webhook-url
WEBHOOK_SECRET=your-webhook-secret
```

## ðŸ“š Commands

### License Commands

```bash
# Validate a license
!license validate <license-key>

# Get license information
!license info <license-key>

# List user's licenses
!license list

# Create a new license
!license create <user-id> <features> <expires>

# Update a license
!license update <license-key> <field> <value>

# Revoke a license
!license revoke <license-key>
```

### User Commands

```bash
# Get user information
!user info <user-id>

# Get user's licenses
!user licenses <user-id>

# Get user's analytics
!user analytics <user-id>

# Ban a user
!user ban <user-id> <reason>

# Unban a user
!user unban <user-id>
```

### Support Commands

```bash
# Create a support ticket
!ticket create <subject> <description>

# List support tickets
!ticket list

# Get ticket details
!ticket info <ticket-id>

# Update ticket status
!ticket update <ticket-id> <status>

# Close a ticket
!ticket close <ticket-id>
```

### Analytics Commands

```bash
# Get usage analytics
!analytics usage [timeframe]

# Get license analytics
!analytics licenses [timeframe]

# Get performance metrics
!analytics performance

# Get error statistics
!analytics errors
```

### Admin Commands

```bash
# Get bot status
!admin status

# Get bot statistics
!admin stats

# Reload commands
!admin reload

# Set bot status
!admin status <status>

# Get bot logs
!admin logs [lines]
```

## ðŸ”§ Configuration

### Bot Configuration

Configure the bot through environment variables or a configuration file:

```javascript
// config/bot.js
module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID
  },
  licensechain: {
    apiKey: process.env.LICENSECHAIN_API_KEY,
    appName: process.env.LICENSECHAIN_APP_NAME,
    version: process.env.LICENSECHAIN_APP_VERSION,
    baseUrl: process.env.LICENSECHAIN_BASE_URL
  },
  bot: {
    prefix: process.env.BOT_PREFIX || '!',
    ownerId: process.env.BOT_OWNER_ID,
    debug: process.env.BOT_DEBUG === 'true'
  }
};
```

### Command Configuration

Configure commands and their permissions:

```javascript
// config/commands.js
module.exports = {
  'license validate': {
    permission: 'user',
    cooldown: 5000,
    description: 'Validate a license key'
  },
  'license create': {
    permission: 'admin',
    cooldown: 10000,
    description: 'Create a new license'
  },
  'admin status': {
    permission: 'owner',
    cooldown: 0,
    description: 'Get bot status'
  }
};
```

### Database Configuration

The bot supports multiple database types:

```javascript
// PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/licensechain

// MySQL
DATABASE_URL=mysql://username:password@localhost:3306/licensechain

// SQLite
DATABASE_URL=sqlite://./database.sqlite
```

## ðŸ›¡ï¸ Security Features

### Authentication

- Discord OAuth2 integration
- Role-based command permissions
- User verification system
- Secure API key management

### Authorization

- Command-level permissions
- User role validation
- Admin-only commands
- Owner-only functions

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure logging

## ðŸ“Š Analytics and Monitoring

### Command Analytics

```javascript
// Track command usage
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    analytics.track('command_used', {
      command: interaction.commandName,
      user: interaction.user.id,
      guild: interaction.guild?.id,
      timestamp: new Date()
    });
  }
});
```

### Performance Monitoring

```javascript
// Monitor command execution time
const start = Date.now();
await command.execute(interaction);
const duration = Date.now() - start;
metrics.record('command_execution_time', duration);
```

### Error Tracking

```javascript
// Track command errors
try {
  await command.execute(interaction);
} catch (error) {
  errorTracker.captureException(error, {
    command: interaction.commandName,
    user: interaction.user.id,
    guild: interaction.guild?.id
  });
}
```

## ðŸ”„ Error Handling

### Custom Error Types

```javascript
// Custom error classes
class CommandError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CommandError';
  }
}

class PermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermissionError';
  }
}
```

### Error Middleware

```javascript
// Global error handler
client.on('error', (error) => {
  console.error('Discord client error:', error);
  errorTracker.captureException(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  errorTracker.captureException(reason);
});
```

## ðŸ§ª Testing

### Unit Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Tests

```bash
# Test with real Discord API
npm run test:integration
```

### End-to-End Tests

```bash
# Test complete command flows
npm run test:e2e
```

## ðŸ“ Examples

See the `examples/` directory for complete examples:

- `basic-setup.js` - Basic bot setup
- `custom-commands.js` - Custom command examples
- `webhook-integration.js` - Webhook handling
- `deployment.js` - Deployment configuration

## ðŸ¤ Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install Node.js 16 or later
3. Install dependencies: `npm install`
4. Set up environment variables
5. Start development server: `npm run dev`

## ðŸ“„ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ðŸ†˜ Support

- **Documentation**: [https://docs.licensechain.app/discord-bot](https://docs.licensechain.app/discord-bot)
- **Issues**: [GitHub Issues](https://github.com/LicenseChain/LicenseChain-Discord-Bot/issues)
- **Discord**: [LicenseChain Discord](https://discord.gg/licensechain)
- **Email**: support@licensechain.app

## ðŸ”— Related Projects

- [LicenseChain Telegram Bot](https://github.com/LicenseChain/LicenseChain-TG-Bot)
- [LicenseChain Node.js SDK](https://github.com/LicenseChain/LicenseChain-NodeJS-SDK)
- [LicenseChain Customer Panel](https://github.com/LicenseChain/LicenseChain-Customer-Panel)

---

**Made with â¤ï¸ for the Discord community**


## API Endpoints

All endpoints automatically use the /v1 prefix when connecting to https://api.licensechain.app.

### Base URL
- **Production**: https://api.licensechain.app/v1\n- **Development**: https://api.licensechain.app/v1\n\n### Available Endpoints\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n| GET | /v1/health | Health check |\n| POST | /v1/auth/login | User login |\n| POST | /v1/auth/register | User registration |\n| GET | /v1/apps | List applications |\n| POST | /v1/apps | Create application |\n| GET | /v1/licenses | List licenses |\n| POST | /v1/licenses/verify | Verify license |\n| GET | /v1/webhooks | List webhooks |\n| POST | /v1/webhooks | Create webhook |\n| GET | /v1/analytics | Get analytics |\n\n**Note**: The SDK automatically prepends /v1 to all endpoints, so you only need to specify the path (e.g., /auth/login instead of /v1/auth/login).

