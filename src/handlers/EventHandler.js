const { Events } = require('discord.js');
const Logger = require('../utils/Logger');
const logger = new Logger('EventHandler');

class EventHandler {
    constructor(client, licenseClient, dbManager) {
        this.client = client;
        this.licenseClient = licenseClient;
        this.dbManager = dbManager;
    }

    async loadEvents() {
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Client ready event
        this.client.once(Events.ClientReady, (readyClient) => {
            logger.info(`Discord bot is ready! Logged in as ${readyClient.user.tag}`);
            logger.info(`Bot is serving ${readyClient.guilds.cache.size} guilds`);
            
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
            logger.error('Discord client error:', error);
        });

        // Warning handling
        this.client.on(Events.Warn, (warning) => {
            logger.warn('Discord client warning:', warning);
        });

        // Debug handling
        this.client.on(Events.Debug, (info) => {
            logger.debug('Discord client debug:', info);
        });

        // Guild join event
        this.client.on(Events.GuildCreate, (guild) => {
            logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);
            logger.info(`Guild member count: ${guild.memberCount}`);
        });

        // Guild leave event
        this.client.on(Events.GuildDelete, (guild) => {
            logger.info(`Bot left guild: ${guild.name} (${guild.id})`);
        });

        // Member join event
        this.client.on(Events.GuildMemberAdd, (member) => {
            logger.info(`New member joined ${member.guild.name}: ${member.user.tag}`);
        });

        // Member leave event
        this.client.on(Events.GuildMemberRemove, (member) => {
            logger.info(`Member left ${member.guild.name}: ${member.user.tag}`);
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
                logger.info(`Command executed: ${commandName} by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
            } catch (error) {
                logger.error(`Error executing command ${commandName}:`, error);
                
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
                logger.info(`Slash command executed: ${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
            } catch (error) {
                logger.error(`Error executing slash command ${interaction.commandName}:`, error);
                
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
            logger.debug(`Voice state update for ${newState.member?.user?.tag || 'unknown'}`);
        });

        // Channel create event
        this.client.on(Events.ChannelCreate, (channel) => {
            logger.info(`Channel created: ${channel.name} in ${channel.guild?.name || 'DM'}`);
        });

        // Channel delete event
        this.client.on(Events.ChannelDelete, (channel) => {
            logger.info(`Channel deleted: ${channel.name} in ${channel.guild?.name || 'DM'}`);
        });

        // Role create event
        this.client.on(Events.RoleCreate, (role) => {
            logger.info(`Role created: ${role.name} in ${role.guild.name}`);
        });

        // Role delete event
        this.client.on(Events.RoleDelete, (role) => {
            logger.info(`Role deleted: ${role.name} in ${role.guild.name}`);
        });
    }
}

module.exports = EventHandler;
