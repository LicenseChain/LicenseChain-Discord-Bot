# 🤖 LicenseChain Discord Bot

**Advanced Discord integration for LicenseChain license management**

[![License](https://img.shields.io/badge/license-Elastic%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-14.14%2B-blue.svg)](https://discord.js.org/)

## ✨ Features

### 🔐 **License Management**
- Validate license keys in real-time
- View detailed license information
- Create and manage licenses
- Track license usage and analytics
- License expiration monitoring

### 📊 **Advanced Analytics**
- Real-time usage statistics
- Revenue tracking and reporting
- User behavior analytics
- Conversion rate monitoring
- Custom dashboard metrics

### 🎯 **Discord Integration**
- Slash commands for easy interaction
- Interactive buttons and modals
- Rich embeds with detailed information
- Pagination for large data sets
- Real-time notifications

### 🔔 **Automation**
- Scheduled license checks
- Expiration notifications
- Usage monitoring
- Automated reports
- Webhook integration

### 🛡️ **Security**
- Secure API communication
- User authentication
- Permission-based access
- Rate limiting protection
- Data encryption

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Discord Bot Token
- LicenseChain API Key
- Discord Server with Bot permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/licensechain/discord-bot.git
   cd discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

### Environment Variables

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id

# LicenseChain API
LICENSE_CHAIN_API_KEY=your_api_key
LICENSE_CHAIN_API_URL=https://api.licensechain.app

# Bot Configuration
LOG_LEVEL=info
PORT=3004

# Database (Optional)
DATABASE_URL=sqlite:./data/bot.db
```

## 📚 Commands

### License Commands

#### `/license validate <key>`
Validate a license key and get its status.

**Example:**
```
/license validate LC-ABC123-DEF456-GHI789
```

**Response:**
- ✅ License Valid - Shows license details and features
- ❌ License Invalid - Shows error message

#### `/license info <key>`
Get detailed information about a license.

**Example:**
```
/license info LC-ABC123-DEF456-GHI789
```

**Shows:**
- Application name
- Plan and pricing
- Expiration date
- Features
- Usage statistics

#### `/license list [page]`
List all your licenses with pagination.

**Example:**
```
/license list
/license list page:2
```

**Features:**
- Paginated results
- Status indicators
- Quick action buttons
- Search functionality

#### `/license create`
Open a modal to create a new license.

**Modal Fields:**
- Application Name
- Plan (monthly/yearly/lifetime)
- Price
- Features (optional)

### Analytics Commands

#### `/analytics overview [period]`
Get an overview of your license analytics.

**Periods:**
- Last 7 days
- Last 30 days
- Last 90 days
- Last year

**Example:**
```
/analytics overview period:30d
```

**Shows:**
- Total revenue
- Active licenses
- User count
- Conversion rates
- Growth metrics

#### `/analytics license <key> [period]`
Get analytics for a specific license.

**Example:**
```
/analytics license key:LC-ABC123-DEF456-GHI789 period:30d
```

**Shows:**
- Validation count
- Usage patterns
- Peak usage times
- Feature usage
- Geographic data

#### `/analytics usage [period]`
View your personal usage statistics.

**Example:**
```
/analytics usage period:7d
```

**Shows:**
- Total validations
- Most used licenses
- Usage trends
- Daily averages
- License breakdown

## 🔧 Configuration

### Bot Permissions

The bot requires the following Discord permissions:

- **Send Messages** - To respond to commands
- **Use Slash Commands** - For command interactions
- **Embed Links** - For rich embeds
- **Attach Files** - For file uploads
- **Read Message History** - For context
- **Add Reactions** - For interactive elements

### Server Setup

1. **Invite the bot** to your Discord server
2. **Grant necessary permissions** (see above)
3. **Configure slash commands** (automatic)
4. **Set up channels** for notifications
5. **Configure roles** for access control

### Database Setup

The bot uses SQLite by default for local data storage:

```bash
# Create data directory
mkdir data

# The bot will automatically create the database
npm start
```

For production, you can use PostgreSQL or MySQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/licensechain_bot
```

## 🛠️ Development

### Project Structure

```
src/
├── commands/          # Slash command implementations
├── handlers/          # Event and command handlers
├── client/           # LicenseChain API client
├── database/         # Database management
├── utils/            # Utility functions
├── events/           # Discord event handlers
└── index.js          # Main bot file
```

### Adding New Commands

1. **Create command file** in `src/commands/`
2. **Define slash command** using SlashCommandBuilder
3. **Implement execute function**
4. **Register command** (automatic)

**Example:**
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command'),
  
  async execute(interaction, licenseClient, dbManager) {
    await interaction.reply('Hello World!');
  }
};
```

### Adding New Events

1. **Create event file** in `src/events/`
2. **Define event handler**
3. **Register event** in EventHandler

**Example:**
```javascript
const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    console.log(`Message: ${message.content}`);
  }
};
```

## 📊 Monitoring

### Health Check

The bot includes a health check endpoint:

```http
GET http://localhost:3004/health
```

**Response:**
```json
{
  "status": "healthy",
  "bot": "online",
  "uptime": 3600,
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Statistics

Get bot statistics:

```http
GET http://localhost:3004/stats
```

**Response:**
```json
{
  "guilds": 5,
  "users": 1250,
  "commands": 12,
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 12345678
  }
}
```

### Logging

The bot uses Winston for structured logging:

- **Console** - Development logging
- **Files** - Production logging
- **Levels** - Error, Warn, Info, Debug

**Log Files:**
- `logs/error.log` - Error messages only
- `logs/combined.log` - All log messages

## 🚀 Deployment

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t licensechain-discord-bot .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name licensechain-bot \
     -e DISCORD_TOKEN=your_token \
     -e LICENSE_CHAIN_API_KEY=your_key \
     -p 3004:3004 \
     licensechain-discord-bot
   ```

### Docker Compose

```yaml
version: '3.8'
services:
  discord-bot:
    build: .
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - LICENSE_CHAIN_API_KEY=${LICENSE_CHAIN_API_KEY}
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bot
    ports:
      - "3004:3004"
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=bot
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Production Setup

1. **Set up environment variables**
2. **Configure database**
3. **Set up monitoring**
4. **Configure logging**
5. **Set up backups**
6. **Configure auto-restart**

## 🔒 Security

### API Security

- **HTTPS only** for API communication
- **API key authentication**
- **Request signing** for webhooks
- **Rate limiting** protection
- **Input validation**

### Discord Security

- **Permission-based access**
- **User authentication**
- **Command cooldowns**
- **Input sanitization**
- **Error handling**

### Data Protection

- **Encrypted storage** for sensitive data
- **Secure configuration** management
- **Audit logging** for actions
- **Data retention** policies
- **GDPR compliance**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Follow JavaScript best practices
- Use ESLint configuration
- Write comprehensive tests
- Document new features
- Follow conventional commits

## 📞 Support

- **Documentation**: [docs.licensechain.app](https://docs.licensechain.app)
- **Issues**: [GitHub Issues](https://github.com/licensechain/discord-bot/issues)
- **Email**: support@licensechain.app
- **Discord**: [LicenseChain Community](https://discord.gg/licensechain)

## 📄 License

This project is licensed under the Elastic License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Discord.js team for the amazing library
- LicenseChain team for the API
- All contributors and supporters

---

**LicenseChain Discord Bot** - Empowering Discord communities with license management 🤖

*Built with ❤️ by the LicenseChain Team*
