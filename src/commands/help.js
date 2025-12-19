const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with LicenseChain Discord Bot commands')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const commandName = interaction.options.getString('command');

            if (commandName) {
                await this.showCommandHelp(interaction, commandName);
            } else {
                await this.showGeneralHelp(interaction);
            }
        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({ 
                content: 'An error occurred while showing help!', 
                flags: 64 // Ephemeral flag
            });
        }
    },

    async showGeneralHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 LicenseChain Discord Bot Help')
            .setDescription('Welcome to the LicenseChain Discord Bot! Here are all available commands:')
            .setColor(0x0099ff)
            .setTimestamp()
            .addFields(
                {
                    name: '🔑 License Commands',
                    value: '`/license create` - Create a new license\n' +
                           '`/license validate` - Validate a license key\n' +
                           '`/license list` - List your licenses\n' +
                           '`/license revoke` - Revoke a license',
                    inline: false
                },
                {
                    name: '👤 User Commands',
                    value: '`/user create` - Create a new user\n' +
                           '`/user info` - Get user information\n' +
                           '`/user update` - Update user information',
                    inline: false
                },
                {
                    name: '📦 Product Commands',
                    value: '`/product create` - Create a new product\n' +
                           '`/product info` - Get product information\n' +
                           '`/product list` - List products',
                    inline: false
                },
                {
                    name: '📊 Analytics Commands',
                    value: '`/analytics stats` - Get license statistics\n' +
                           '`/analytics revenue` - Get revenue analytics\n' +
                           '`/analytics users` - Get user analytics',
                    inline: false
                },
                {
                    name: '⚙️ Admin Commands',
                    value: '`/admin stats` - Get system statistics\n' +
                           '`/admin users` - List all users\n' +
                           '`/admin products` - List all products\n' +
                           '`/admin webhooks` - List webhooks\n' +
                           '`/admin health` - Check API health',
                    inline: false
                },
                {
                    name: '❓ Help Commands',
                    value: '`/help` - Show this help message\n' +
                           '`/help <command>` - Get help for a specific command',
                    inline: false
                }
            )
            .setFooter({ text: 'Use /help <command> for detailed information about a specific command' });

        await interaction.reply({ embeds: [embed] });
    },

    async showCommandHelp(interaction, commandName) {
        const commandHelp = this.getCommandHelp(commandName);

        if (!commandHelp) {
            await interaction.reply({ 
                content: `Command \`${commandName}\` not found! Use \`/help\` to see all available commands.`, 
                flags: 64
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`❓ Help: /${commandName}`)
            .setDescription(commandHelp.description)
            .setColor(0x00ff00)
            .setTimestamp();

        if (commandHelp.usage) {
            embed.addFields({
                name: 'Usage',
                value: commandHelp.usage,
                inline: false
            });
        }

        if (commandHelp.examples && commandHelp.examples.length > 0) {
            embed.addFields({
                name: 'Examples',
                value: commandHelp.examples.join('\n'),
                inline: false
            });
        }

        if (commandHelp.permissions) {
            embed.addFields({
                name: 'Required Permissions',
                value: commandHelp.permissions,
                inline: false
            });
        }

        if (commandHelp.aliases && commandHelp.aliases.length > 0) {
            embed.addFields({
                name: 'Aliases',
                value: commandHelp.aliases.join(', '),
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    getCommandHelp(commandName) {
        const commandHelps = {
            'license': {
                description: 'Manage licenses in the LicenseChain system',
                usage: '`/license <subcommand> [options]`',
                examples: [
                    '`/license create user:user123 product:product456`',
                    '`/license validate key:ABCD1234EFGH5678`',
                    '`/license list page:1 limit:10`'
                ],
                aliases: ['lic']
            },
            'license create': {
                description: 'Create a new license for a user and product',
                usage: '`/license create user:<user_id> product:<product_id> [metadata]`',
                examples: [
                    '`/license create user:user123 product:product456`',
                    '`/license create user:user123 product:product456 metadata:{"platform":"discord"}`'
                ]
            },
            'license validate': {
                description: 'Validate a license key',
                usage: '`/license validate key:<license_key>`',
                examples: [
                    '`/license validate key:ABCD1234EFGH5678IJKL9012MNOP3456`'
                ]
            },
            'license list': {
                description: 'List licenses for a user',
                usage: '`/license list user:<user_id> [page] [limit]`',
                examples: [
                    '`/license list user:user123`',
                    '`/license list user:user123 page:1 limit:10`'
                ]
            },
            'license revoke': {
                description: 'Revoke a license',
                usage: '`/license revoke id:<license_id>`',
                examples: [
                    '`/license revoke id:lic_123456789`'
                ],
                permissions: 'Administrator'
            },
            'user': {
                description: 'Manage users in the LicenseChain system',
                usage: '`/user <subcommand> [options]`',
                examples: [
                    '`/user create email:user@example.com name:John Doe`',
                    '`/user info id:user123`',
                    '`/user update id:user123 name:Jane Doe`'
                ]
            },
            'user create': {
                description: 'Create a new user',
                usage: '`/user create email:<email> name:<name> [metadata]`',
                examples: [
                    '`/user create email:user@example.com name:John Doe`',
                    '`/user create email:user@example.com name:John Doe metadata:{"source":"discord"}`'
                ]
            },
            'user info': {
                description: 'Get user information',
                usage: '`/user info id:<user_id>`',
                examples: [
                    '`/user info id:user123`'
                ]
            },
            'user update': {
                description: 'Update user information',
                usage: '`/user update id:<user_id> [name] [email] [metadata]`',
                examples: [
                    '`/user update id:user123 name:Jane Doe`',
                    '`/user update id:user123 email:jane@example.com`'
                ]
            },
            'product': {
                description: 'Manage products in the LicenseChain system',
                usage: '`/product <subcommand> [options]`',
                examples: [
                    '`/product create name:My Product price:99.99 currency:USD`',
                    '`/product info id:product123`',
                    '`/product list page:1 limit:10`'
                ]
            },
            'product create': {
                description: 'Create a new product',
                usage: '`/product create name:<name> price:<price> currency:<currency> [description] [metadata]`',
                examples: [
                    '`/product create name:My Product price:99.99 currency:USD`',
                    '`/product create name:My Product price:99.99 currency:USD description:A great product`'
                ]
            },
            'product info': {
                description: 'Get product information',
                usage: '`/product info id:<product_id>`',
                examples: [
                    '`/product info id:product123`'
                ]
            },
            'product list': {
                description: 'List products',
                usage: '`/product list [page] [limit]`',
                examples: [
                    '`/product list`',
                    '`/product list page:1 limit:10`'
                ]
            },
            'analytics': {
                description: 'View analytics and statistics',
                usage: '`/analytics <subcommand> [options]`',
                examples: [
                    '`/analytics stats`',
                    '`/analytics revenue`',
                    '`/analytics users`'
                ]
            },
            'analytics stats': {
                description: 'Get license statistics',
                usage: '`/analytics stats`',
                examples: [
                    '`/analytics stats`'
                ]
            },
            'analytics revenue': {
                description: 'Get revenue analytics',
                usage: '`/analytics revenue [period]`',
                examples: [
                    '`/analytics revenue`',
                    '`/analytics revenue period:monthly`'
                ]
            },
            'analytics users': {
                description: 'Get user analytics',
                usage: '`/analytics users [period]`',
                examples: [
                    '`/analytics users`',
                    '`/analytics users period:weekly`'
                ]
            },
            'admin': {
                description: 'Administrative commands for LicenseChain management',
                usage: '`/admin <subcommand> [options]`',
                examples: [
                    '`/admin stats`',
                    '`/admin users page:1 limit:10`',
                    '`/admin health`'
                ],
                permissions: 'Administrator'
            },
            'admin stats': {
                description: 'Get system statistics',
                usage: '`/admin stats`',
                examples: [
                    '`/admin stats`'
                ],
                permissions: 'Administrator'
            },
            'admin users': {
                description: 'List all users',
                usage: '`/admin users [page] [limit]`',
                examples: [
                    '`/admin users`',
                    '`/admin users page:1 limit:10`'
                ],
                permissions: 'Administrator'
            },
            'admin products': {
                description: 'List all products',
                usage: '`/admin products [page] [limit]`',
                examples: [
                    '`/admin products`',
                    '`/admin products page:1 limit:10`'
                ],
                permissions: 'Administrator'
            },
            'admin webhooks': {
                description: 'List webhooks',
                usage: '`/admin webhooks`',
                examples: [
                    '`/admin webhooks`'
                ],
                permissions: 'Administrator'
            },
            'admin health': {
                description: 'Check API health',
                usage: '`/admin health`',
                examples: [
                    '`/admin health`'
                ],
                permissions: 'Administrator'
            },
            'help': {
                description: 'Get help with LicenseChain Discord Bot commands',
                usage: '`/help [command]`',
                examples: [
                    '`/help`',
                    '`/help license`',
                    '`/help admin`'
                ],
                aliases: ['h', '?']
            }
        };

        return commandHelps[commandName];
    }
};
