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
                    await this.handleStats(interaction, client);
                    break;
                case 'users':
                    await this.handleUsers(interaction, client);
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
                    await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
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

    async handleStats(interaction, client) {
        await interaction.deferReply();

        try {
            const [licenseStats, userStats, productStats] = await Promise.all([
                client.getLicenseStats(),
                client.getUserStats(),
                client.getProductStats()
            ]);

            const embed = new EmbedBuilder()
                .setTitle('📊 LicenseChain Statistics')
                .setColor(0x00ff00)
                .setTimestamp()
                .addFields(
                    {
                        name: '🔑 Licenses',
                        value: `Total: ${licenseStats.total}\nActive: ${licenseStats.active}\nExpired: ${licenseStats.expired}\nRevoked: ${licenseStats.revoked}\nRevenue: $${licenseStats.revenue}`,
                        inline: true
                    },
                    {
                        name: '👤 Users',
                        value: `Total: ${userStats.total}\nActive: ${userStats.active}\nInactive: ${userStats.inactive}`,
                        inline: true
                    },
                    {
                        name: '📦 Products',
                        value: `Total: ${productStats.total}\nActive: ${productStats.active}\nRevenue: $${productStats.revenue}`,
                        inline: true
                    }
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error fetching stats:', error);
            await interaction.editReply({ 
                content: 'Failed to fetch statistics. Please try again later.' 
            });
        }
    },

    async handleUsers(interaction, client) {
        await interaction.deferReply();

        try {
            const page = interaction.options.getInteger('page') || 1;
            const limit = interaction.options.getInteger('limit') || 10;

            const response = await client.listUsers(page, limit);
            const users = response.data;

            if (users.length === 0) {
                await interaction.editReply({ content: 'No users found.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`👤 Users (Page ${page})`)
                .setColor(0x0099ff)
                .setTimestamp()
                .setFooter({ text: `Total: ${response.total} users` });

            const userList = users.map(user => 
                `**${user.name}**\n` +
                `ID: \`${user.id}\`\n` +
                `Email: ${user.email}\n` +
                `Created: ${new Date(user.created_at).toLocaleDateString()}`
            ).join('\n\n');

            embed.setDescription(userList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error fetching users:', error);
            await interaction.editReply({ 
                content: 'Failed to fetch users. Please try again later.' 
            });
        }
    },

    async handleProducts(interaction, client) {
        await interaction.deferReply();

        try {
            const page = interaction.options.getInteger('page') || 1;
            const limit = interaction.options.getInteger('limit') || 10;

            const response = await client.listProducts(page, limit);
            const products = response.data;

            if (products.length === 0) {
                await interaction.editReply({ content: 'No products found.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📦 Products (Page ${page})`)
                .setColor(0xff9900)
                .setTimestamp()
                .setFooter({ text: `Total: ${response.total} products` });

            const productList = products.map(product => 
                `**${product.name}**\n` +
                `ID: \`${product.id}\`\n` +
                `Price: $${product.price} ${product.currency}\n` +
                `Created: ${new Date(product.created_at).toLocaleDateString()}`
            ).join('\n\n');

            embed.setDescription(productList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error fetching products:', error);
            await interaction.editReply({ 
                content: 'Failed to fetch products. Please try again later.' 
            });
        }
    },

    async handleWebhooks(interaction, client) {
        await interaction.deferReply();

        try {
            const response = await client.listWebhooks();
            const webhooks = response.data;

            if (webhooks.length === 0) {
                await interaction.editReply({ content: 'No webhooks found.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔗 Webhooks')
                .setColor(0x9932cc)
                .setTimestamp()
                .setFooter({ text: `Total: ${response.total} webhooks` });

            const webhookList = webhooks.map(webhook => 
                `**${webhook.id}**\n` +
                `URL: ${webhook.url}\n` +
                `Events: ${webhook.events.join(', ')}\n` +
                `Created: ${new Date(webhook.created_at).toLocaleDateString()}`
            ).join('\n\n');

            embed.setDescription(webhookList);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error fetching webhooks:', error);
            await interaction.editReply({ 
                content: 'Failed to fetch webhooks. Please try again later.' 
            });
        }
    },

    async handleHealth(interaction, client) {
        await interaction.deferReply();

        try {
            const [ping, health] = await Promise.all([
                client.ping(),
                client.health()
            ]);

            const embed = new EmbedBuilder()
                .setTitle('🏥 API Health Check')
                .setColor(0x00ff00)
                .setTimestamp()
                .addFields(
                    {
                        name: '📡 Ping',
                        value: `Message: ${ping.message}\nTime: ${ping.time}`,
                        inline: true
                    },
                    {
                        name: '💚 Health',
                        value: `Status: ${health.status}\nVersion: ${health.version}\nTimestamp: ${health.timestamp}`,
                        inline: true
                    }
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error checking health:', error);
            await interaction.editReply({ 
                content: 'Failed to check API health. Please try again later.' 
            });
        }
    }
};
