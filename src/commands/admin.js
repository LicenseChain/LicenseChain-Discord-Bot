const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LicenseChainClient = require('../client/LicenseChainClient');
const Logger = require('../utils/Logger');
const Utils = require('../utils/Utils');
const PermissionManager = require('../utils/PermissionManager');
const Validator = require('../utils/Validator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for LicenseChain management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Get LicenseChain statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('users')
                .setDescription('List users')
                .addIntegerOption(option =>
                    option
                        .setName('page')
                        .setDescription('Page number')
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('Number of users per page')
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('products')
                .setDescription('List products')
                .addIntegerOption(option =>
                    option
                        .setName('page')
                        .setDescription('Page number')
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('Number of products per page')
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('webhooks')
                .setDescription('List webhooks')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('health')
                .setDescription('Check API health')
        ),

    async execute(interaction, licenseClient, dbManager) {
        const logger = new Logger('AdminCommand');
        
        try {
            // Check permissions using PermissionManager
            const permissionManager = new PermissionManager(interaction.client);
            await permissionManager.requirePermission(interaction.member, 'admin');

            const subcommand = interaction.options.getSubcommand();
            const client = licenseClient || new LicenseChainClient({
                apiKey: process.env.LICENSE_CHAIN_API_KEY,
                baseUrl: process.env.LICENSE_CHAIN_API_URL || 'https://api.licensechain.app'
            });

            switch (subcommand) {
                case 'stats':
                    await this.handleStats(interaction, client, dbManager);
                    break;
                case 'users':
                    await this.handleUsers(interaction, client, dbManager);
                    break;
                case 'products':
                    await this.handleProducts(interaction, client);
                    break;
                case 'webhooks':
                    await this.handleWebhooks(interaction, client);
                    break;
                case 'health':
                    await this.handleHealth(interaction, client);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand!', flags: 64 });
            }
        } catch (error) {
            logger.error('Error in admin command:', error);
            
            const errorMessage = error.message.includes('Insufficient permissions') 
                ? error.message 
                : 'An error occurred while executing the admin command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ 
                    content: errorMessage, 
                    flags: 64 // Ephemeral flag
                });
            }
        }
    },

    async handleStats(interaction, client, dbManager) {
        await interaction.deferReply();
        const logger = new Logger('AdminCommand');

        try {
            // Get stats from database
            const dbStats = dbManager ? await dbManager.getBotStats() : null;
            
            // Get analytics from API
            let apiStats = null;
            try {
                apiStats = await client.getAnalytics('30d', ['licenses', 'users', 'revenue']);
            } catch (apiError) {
                logger.warn('Could not fetch API stats:', apiError.message);
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 LicenseChain Statistics')
                .setColor(0x00ff00)
                .setTimestamp();

            // Database stats
            if (dbStats) {
                embed.addFields({
                    name: '💾 Database Stats',
                    value: `Users: ${dbStats.totalUsers || 0}\nLicenses: ${dbStats.totalLicenses || 0}\nCommands: ${dbStats.totalCommands || 0}`,
                    inline: true
                });
            }

            // API stats
            if (apiStats) {
                const licenseCount = apiStats.licenses?.total || apiStats.licenses || 0;
                const userCount = apiStats.users?.total || apiStats.users || 0;
                const revenue = apiStats.revenue?.total || apiStats.revenue || 0;
                
                embed.addFields({
                    name: '🌐 API Stats',
                    value: `Licenses: ${licenseCount}\nUsers: ${userCount}\nRevenue: $${revenue}`,
                    inline: true
                });
            }

            if (!dbStats && !apiStats) {
                embed.setDescription('No statistics available. Please check your API and database configuration.');
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error fetching stats:', error);
            await interaction.editReply({ 
                content: 'Failed to fetch statistics. Please try again later.' 
            });
        }
    },

    async handleUsers(interaction, client, dbManager) {
        await interaction.deferReply();
        const logger = new Logger('AdminCommand');

        try {
            const page = Validator.validateInteger(interaction.options.getInteger('page') || 1, 1, 100);
            const limit = Validator.validateInteger(interaction.options.getInteger('limit') || 10, 1, 50);

            // Get users from database
            let users = [];
            let totalUsers = 0;

            if (dbManager) {
                try {
                    // Get all users from database
                    const dbUsers = await dbManager.getAllUsers();
                    totalUsers = dbUsers.length;
                    
                    // Paginate
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    users = dbUsers.slice(startIndex, endIndex);
                } catch (dbError) {
                    logger.warn('Could not fetch users from database:', dbError.message);
                }
            }

            if (users.length === 0) {
                await interaction.editReply({ content: 'No users found in database.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`👤 Users (Page ${page})`)
                .setColor(0x0099ff)
                .setTimestamp()
                .setFooter({ text: `Total: ${totalUsers} users` });

            const userList = users.map(user => 
                `**${user.username || 'Unknown'}**\n` +
                `Discord ID: \`${user.discord_id}\`\n` +
                `Created: ${new Date(user.created_at).toLocaleDateString()}`
            ).join('\n\n');

            embed.setDescription(userList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error fetching users:', error);
            await interaction.editReply({ 
                content: `Failed to fetch users: ${error.message}` 
            });
        }
    },

    async handleProducts(interaction, client) {
        await interaction.deferReply();
        const logger = new Logger('AdminCommand');

        try {
            const page = Validator.validateInteger(interaction.options.getInteger('page') || 1, 1, 100);
            const limit = Validator.validateInteger(interaction.options.getInteger('limit') || 10, 1, 50);

            // Get apps/products from API
            let apps = [];
            try {
                const response = await client.client.get('/v1/apps');
                const allApps = response.data?.apps || response.data || [];
                
                // Paginate
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                apps = allApps.slice(startIndex, endIndex);
            } catch (apiError) {
                logger.warn('Could not fetch apps from API:', apiError.message);
            }

            if (apps.length === 0) {
                await interaction.editReply({ content: 'No products/apps found. Please check your API configuration.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📦 Products/Apps (Page ${page})`)
                .setColor(0xff9900)
                .setTimestamp();

            const productList = apps.map(app => 
                `**${app.name || app.id}**\n` +
                `ID: \`${app.id}\`\n` +
                `Slug: ${app.slug || 'N/A'}\n` +
                `Created: ${app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown'}`
            ).join('\n\n');

            embed.setDescription(productList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error fetching products:', error);
            await interaction.editReply({ 
                content: `Failed to fetch products: ${error.message}` 
            });
        }
    },

    async handleWebhooks(interaction, client) {
        await interaction.deferReply();
        const logger = new Logger('AdminCommand');

        try {
            // Try to get webhooks from API
            let webhooks = [];
            try {
                const response = await client.client.get('/v1/webhooks');
                webhooks = response.data?.webhooks || response.data || [];
            } catch (apiError) {
                logger.warn('Could not fetch webhooks from API:', apiError.message);
            }

            if (webhooks.length === 0) {
                await interaction.editReply({ content: 'No webhooks found. Webhooks may not be configured or the API endpoint may not be available.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔗 Webhooks')
                .setColor(0x9932cc)
                .setTimestamp()
                .setFooter({ text: `Total: ${webhooks.length} webhooks` });

            const webhookList = webhooks.map(webhook => 
                `**${webhook.id || 'Unknown'}**\n` +
                `URL: ${webhook.url ? webhook.url.substring(0, 50) + '...' : 'N/A'}\n` +
                `Events: ${webhook.events ? webhook.events.join(', ') : 'N/A'}\n` +
                `Created: ${webhook.created_at ? new Date(webhook.created_at).toLocaleDateString() : 'Unknown'}`
            ).join('\n\n');

            embed.setDescription(webhookList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error fetching webhooks:', error);
            await interaction.editReply({ 
                content: `Failed to fetch webhooks: ${error.message}` 
            });
        }
    },

    async handleHealth(interaction, client) {
        await interaction.deferReply();
        const logger = new Logger('AdminCommand');

        try {
            // Check API health
            let healthStatus = null;
            let apiResponseTime = null;
            
            try {
                const startTime = Date.now();
                healthStatus = await client.healthCheck();
                apiResponseTime = Date.now() - startTime;
            } catch (apiError) {
                logger.warn('API health check failed:', apiError.message);
                healthStatus = { status: 'unhealthy', error: apiError.message };
            }

            const embed = new EmbedBuilder()
                .setTitle('🏥 API Health Check')
                .setColor(healthStatus?.status === 'healthy' ? 0x00ff00 : 0xff0000)
                .setTimestamp()
                .addFields(
                    {
                        name: '🌐 API Status',
                        value: healthStatus?.status || 'Unknown',
                        inline: true
                    },
                    {
                        name: '⏱️ Response Time',
                        value: apiResponseTime ? `${apiResponseTime}ms` : 'N/A',
                        inline: true
                    }
                );

            if (healthStatus?.version) {
                embed.addFields({ name: '📦 Version', value: healthStatus.version, inline: true });
            }

            if (healthStatus?.error) {
                embed.addFields({ name: '❌ Error', value: Validator.sanitizeForDisplay(healthStatus.error), inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error checking health:', error);
            await interaction.editReply({ 
                content: `Failed to check API health: ${error.message}` 
            });
        }
    }
};
