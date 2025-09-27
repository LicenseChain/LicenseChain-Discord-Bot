const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

class EventHandler {
    constructor(client) {
        this.client = client;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Client ready event
        this.client.once(Events.ClientReady, (readyClient) => {
            Logger.success(`Discord bot is ready! Logged in as ${readyClient.user.tag}`);
            Logger.info(`Bot is serving ${readyClient.guilds.cache.size} guilds`);
            
            // Set bot status
            this.client.user.setPresence({
                activities: [{
                    name: 'LicenseChain Management',
                    type: 3 // WATCHING
                }],
                status: 'online'
            });
        });

        // Error handling
        this.client.on(Events.Error, (error) => {
            Logger.error('Discord client error:', error);
        });

        // Warning handling
        this.client.on(Events.Warn, (warning) => {
            Logger.warn('Discord client warning:', warning);
        });

        // Debug handling
        this.client.on(Events.Debug, (info) => {
            Logger.debug('Discord client debug:', info);
        });

        // Guild join event
        this.client.on(Events.GuildCreate, (guild) => {
            Logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);
            Logger.info(`Guild member count: ${guild.memberCount}`);
        });

        // Guild leave event
        this.client.on(Events.GuildDelete, (guild) => {
            Logger.info(`Bot left guild: ${guild.name} (${guild.id})`);
        });

        // Member join event
        this.client.on(Events.GuildMemberAdd, (member) => {
            Logger.info(`New member joined ${member.guild.name}: ${member.user.tag}`);
        });

        // Member leave event
        this.client.on(Events.GuildMemberRemove, (member) => {
            Logger.info(`Member left ${member.guild.name}: ${member.user.tag}`);
        });

        // Message create event (for command handling)
        this.client.on(Events.MessageCreate, async (message) => {
            // Ignore messages from bots
            if (message.author.bot) return;

            // Check if message starts with bot prefix
            const prefix = process.env.DISCORD_PREFIX || '!';
            if (!message.content.startsWith(prefix)) return;

            // Extract command and arguments
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Get command from client
            const command = this.client.commands?.get(commandName);
            if (!command) return;

            try {
                // Check if command is guild only
                if (command.guildOnly && !message.guild) {
                    return message.reply('This command can only be used in a server!');
                }

                // Check permissions
                if (command.permissions && !message.member?.permissions.has(command.permissions)) {
                    return message.reply('You do not have permission to use this command!');
                }

                // Execute command
                await command.execute(message, args);
                Logger.info(`Command executed: ${commandName} by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
            } catch (error) {
                Logger.error(`Error executing command ${commandName}:`, error);
                
                const errorMessage = 'There was an error while executing this command!';
                if (message.replied || message.deferred) {
                    await message.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await message.reply({ content: errorMessage, ephemeral: true });
                }
            }
        });

        // Interaction create event (for slash commands)
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.client.commands?.get(interaction.commandName);
            if (!command) return;

            try {
                // Check if command is guild only
                if (command.guildOnly && !interaction.guild) {
                    return interaction.reply({ 
                        content: 'This command can only be used in a server!', 
                        ephemeral: true 
                    });
                }

                // Check permissions
                if (command.permissions && !interaction.member?.permissions.has(command.permissions)) {
                    return interaction.reply({ 
                        content: 'You do not have permission to use this command!', 
                        ephemeral: true 
                    });
                }

                // Execute command
                await command.execute(interaction);
                Logger.info(`Slash command executed: ${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
            } catch (error) {
                Logger.error(`Error executing slash command ${interaction.commandName}:`, error);
                
                const errorMessage = 'There was an error while executing this command!';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        });

        // Voice state update event
        this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
            // Handle voice state changes if needed
            Logger.debug(`Voice state update for ${newState.member.user.tag}`);
        });

        // Channel create event
        this.client.on(Events.ChannelCreate, (channel) => {
            Logger.info(`Channel created: ${channel.name} in ${channel.guild?.name || 'DM'}`);
        });

        // Channel delete event
        this.client.on(Events.ChannelDelete, (channel) => {
            Logger.info(`Channel deleted: ${channel.name} in ${channel.guild?.name || 'DM'}`);
        });

        // Role create event
        this.client.on(Events.RoleCreate, (role) => {
            Logger.info(`Role created: ${role.name} in ${role.guild.name}`);
        });

        // Role delete event
        this.client.on(Events.RoleDelete, (role) => {
            Logger.info(`Role deleted: ${role.name} in ${role.guild.name}`);
        });

        // Process exit handling
        process.on('SIGINT', () => {
            Logger.info('Received SIGINT, shutting down gracefully...');
            this.client.destroy();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            Logger.info('Received SIGTERM, shutting down gracefully...');
            this.client.destroy();
            process.exit(0);
        });

        process.on('unhandledRejection', (reason, promise) => {
            Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        process.on('uncaughtException', (error) => {
            Logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }
}

module.exports = EventHandler;
