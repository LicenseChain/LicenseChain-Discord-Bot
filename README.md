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

# Run the container with environment variables
# Option 1: Use --env-file to load from .env file
docker run -d \
  --name licensechain-discord-bot \
  --env-file .env \
  -p 3004:3004 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  licensechain-discord-bot

# Option 2: Pass environment variables directly
docker run -d \
  --name licensechain-discord-bot \
  -e DISCORD_TOKEN=your-discord-bot-token \
  -e LICENSE_CHAIN_API_KEY=your-api-key \
  -e LICENSE_CHAIN_API_URL=https://api.licensechain.app \
  -e LICENSECHAIN_APP_NAME=your-app-name \
  -p 3004:3004 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  licensechain-discord-bot

# Option 3: Use docker-compose (recommended)
docker-compose up -d
```

**Important Docker Notes:**
- The `.env` file is NOT copied into the image for security reasons
- You must pass environment variables using `--env-file` or `-e` flags
- Mount volumes for `data/` and `logs/` to persist data between container restarts
- Default port is 3004 (not 3000)

**Docker Permission Issues:**
If you encounter permission errors (`SQLITE_CANTOPEN` or `EACCES`), try one of these solutions:

1. **Fix permissions on host (Linux/Mac):**
   ```bash
   sudo chown -R 1000:1000 ./data ./logs
   sudo chmod -R 755 ./data ./logs
   ```

2. **Use named volumes instead of bind mounts:**
   ```yaml
   volumes:
     - bot-data:/app/data
     - bot-logs:/app/logs
   volumes:
     bot-data:
     bot-logs:
   ```

3. **Run container as root (not recommended for production):**
   ```yaml
   user: "0:0"
   ```

4. **On Windows:** The entrypoint script will attempt to fix permissions automatically. If issues persist, ensure Docker Desktop has proper file sharing permissions enabled.

### Method 3: Docker Compose (Recommended for Docker)

```bash
# Create .env file with your configuration
cp .env.example .env
nano .env  # Edit with your values

# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

### Method 4: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/LicenseChain/LicenseChain-Discord-Bot/releases)
2. Extract to your project directory
3. Install dependencies: `npm install`
4. Configure environment variables
5. Start the bot: `npm start`

## 🚀 Quick Start

### Step 1: Create a Discord Bot

Before you can use this bot, you need to create a Discord application and bot. Follow these steps:

#### 1.1 Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** in the top right corner
3. Enter a name for your application (e.g., "LicenseChain Bot")
4. Click **"Create"**

#### 1.2 Create a Bot

1. In your application, navigate to the **"Bot"** section in the left sidebar
2. Click **"Add Bot"** and confirm
3. Your bot has been created! You'll see the bot's username and icon

#### 1.3 Get Your Bot Token

1. Still in the **"Bot"** section, scroll down to find the **"Token"** section
2. Click **"Reset Token"** if this is your first time, or **"Copy"** to copy your existing token
3. **⚠️ IMPORTANT**: Keep this token secret! Never share it or commit it to public repositories
4. Save this token - you'll need it for your `.env` file

#### 1.4 Enable Privileged Gateway Intents

The bot requires certain privileged intents to function properly. In the **"Bot"** section:

1. Scroll down to **"Privileged Gateway Intents"**
2. Enable the following intents:
   - ✅ **Message Content Intent** - Required for reading message content
   - ✅ **Server Members Intent** - Required for accessing guild member information
   - ✅ **Presence Intent** - Required for presence update events

**Note**: These intents require verification if your bot reaches 100+ servers.

#### 1.5 Set Up OAuth2 and Permissions

1. Navigate to the **"OAuth2"** → **"URL Generator"** section
2. Under **"Scopes"**, select:
   - ✅ **`bot`** - Required to add the bot to servers
   - ✅ **`applications.commands`** - Required for slash commands
3. Under **"Bot Permissions"**, select the following permissions:

   **General Permissions:**
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Use Slash Commands
   - ✅ Manage Messages (optional, for message management)
   - ✅ Add Reactions (optional, for interactive features)

   **Text Permissions:**
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Read Message History
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Add Reactions

4. Copy the generated **"Generated URL"** at the bottom of the page
5. Open this URL in your browser to invite the bot to your Discord server
6. Select the server where you want to add the bot and authorize it

#### 1.6 Configure Bot Settings (Optional)

In the **"Bot"** section, you can also configure:

- **Public Bot**: Enable if you want others to be able to add your bot
- **Requires OAuth2 Code Grant**: Usually leave this disabled unless you have specific OAuth2 requirements

### Step 2: Install and Configure the Bot

```bash
# Clone the repository
git clone https://github.com/LicenseChain/LicenseChain-Discord-Bot.git
cd LicenseChain-Discord-Bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred text editor
```

### Step 3: Environment Configuration

Edit your `.env` file with the following variables:

```env
# Discord Configuration
# Get your bot token from: https://discord.com/developers/applications
DISCORD_TOKEN=your-discord-bot-token-here
# Command prefix for text-based commands (default: !)
DISCORD_PREFIX=!

# LicenseChain API Configuration
# Get your API key from: https://licensechain.app
LICENSE_CHAIN_API_KEY=your-licensechain-api-key-here
LICENSE_CHAIN_API_URL=https://api.licensechain.app
LICENSECHAIN_APP_NAME=your-app-name-here
LICENSECHAIN_APP_VERSION=1.0.0

# Database Configuration
# SQLite database path (default: data/bot.db)
DATABASE_URL=data/bot.db

# Server Configuration
# Port for health check server (default: 3004)
PORT=3004

# Logging Configuration
# Log level: error, warn, info, debug (default: info)
LOG_LEVEL=info

# Node Environment
# Set to 'production' for production, 'development' for development
NODE_ENV=development
```

### Step 4: Start the Bot

```bash
# Start the bot
npm start

# Or for development with auto-reload
npm run dev
```

You should see a message indicating the bot has logged in successfully!

## 📋 Required Discord Bot Settings Summary

### Required Scopes
- ✅ `bot` - Required to add the bot to servers
- ✅ `applications.commands` - Required for slash commands

### Required Privileged Gateway Intents
- ✅ **Message Content Intent** - Required for reading message content
- ✅ **Server Members Intent** - Required for accessing guild member information  
- ✅ **Presence Intent** - Required for presence update events

### Required Bot Permissions
- ✅ View Channels
- ✅ Send Messages
- ✅ Read Message History
- ✅ Embed Links
- ✅ Attach Files
- ✅ Use Slash Commands
- ✅ Add Reactions (recommended)
- ✅ Send Messages in Threads (recommended)
- ✅ Manage Messages (optional, for advanced features)

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

The bot uses a **custom role-based permission system** with three levels:

1. **Owner** - Bot owner (configured via `BOT_OWNER_ID` in `.env`)
   - Highest level of access
   - Can execute owner-only commands
   - Configured by Discord User ID

2. **Admin** - Server administrators or custom admin roles
   - Can execute admin commands
   - Detected via:
     - Discord's built-in Administrator permission, OR
     - Custom admin roles (configured via `ADMIN_ROLE_IDS` in `.env`)

3. **User** - Regular users
   - Default permission level
   - Can execute public commands

**Permission Hierarchy:** Owner > Admin > User

**Configuration:**
```env
# Set bot owner (required for owner commands)
BOT_OWNER_ID=your-discord-user-id

# Optional: Set custom admin role IDs (comma-separated)
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
```

### Data Protection

The bot implements comprehensive security measures:

- **Input Validation** - All user inputs are validated before processing
  - License keys: Format validation (alphanumeric, dashes, underscores, 10-100 chars)
  - User IDs: Discord snowflake validation (17-19 digits)
  - Email addresses: Format validation
  - URLs: Protocol validation (HTTP/HTTPS only)
  - Numbers: Range validation with min/max limits

- **XSS Protection** - All text outputs are sanitized
  - HTML tags removed (`<`, `>`)
  - JavaScript protocols blocked (`javascript:`)
  - Event handlers removed (`onclick=`, etc.)
  - Character limits enforced (2000 chars for strings, 1024 for embeds)

- **SQL Injection Prevention** - Parameterized queries with additional sanitization
  - All database queries use parameterized statements
  - Additional pattern filtering for SQL keywords
  - Special characters sanitized

- **Secure Logging** - Sensitive data is not logged
  - API keys and tokens excluded from logs
  - User data sanitized before logging
  - Error messages don't expose internal details

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
- **Production**: https://api.licensechain.app/v1
- **Development**: https://api.licensechain.app/v1

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/health | Health check |
| POST | /v1/auth/login | User login |
| POST | /v1/auth/register | User registration |
| GET | /v1/apps | List applications |
| POST | /v1/apps | Create application |
| GET | /v1/licenses | List licenses |
| POST | /v1/licenses/verify | Verify license |
| GET | /v1/webhooks | List webhooks |
| POST | /v1/webhooks | Create webhook |
| GET | /v1/analytics | Get analytics |

**Note**: The SDK automatically prepends /v1 to all endpoints, so you only need to specify the path (e.g., /auth/login instead of /v1/auth/login).

