/**
 * Command Handler for Discord Bot
 */

const { Collection, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(client, licenseClient, dbManager) {
    this.client = client;
    this.licenseClient = licenseClient;
    this.dbManager = dbManager;
    this.commands = new Collection();
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        this.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }

    // Register slash commands
    await this.registerSlashCommands();
  }

  async registerSlashCommands() {
    try {
      const commands = Array.from(this.commands.values()).map(command => command.data.toJSON());
      
      // Register commands globally
      await this.client.application.commands.set(commands);
      console.log(`Successfully registered ${commands.length} slash commands globally.`);
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, this.licenseClient, this.dbManager);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while executing this command.')
        .setTimestamp();

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }

  // Utility methods for creating common embeds
  createSuccessEmbed(title, description) {
    return new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }

  createErrorEmbed(title, description) {
    return new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }

  createInfoEmbed(title, description) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }

  createWarningEmbed(title, description) {
    return new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }

  // Create pagination buttons
  createPaginationButtons(currentPage, totalPages, customId) {
    const row = new ActionRowBuilder();

    if (currentPage > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${customId}_first`)
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`${customId}_prev`)
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (currentPage < totalPages) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${customId}_next`)
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`${customId}_last`)
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    return row;
  }

  // Create modal for license creation
  createLicenseModal() {
    const modal = new ModalBuilder()
      .setCustomId('create_license_modal')
      .setTitle('Create New License');

    const applicationNameInput = new TextInputBuilder()
      .setCustomId('application_name')
      .setLabel('Application Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter application name')
      .setRequired(true);

    const planInput = new TextInputBuilder()
      .setCustomId('plan')
      .setLabel('Plan (monthly/yearly/lifetime)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('monthly')
      .setRequired(true);

    const priceInput = new TextInputBuilder()
      .setCustomId('price')
      .setLabel('Price')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('99.99')
      .setRequired(true);

    const featuresInput = new TextInputBuilder()
      .setCustomId('features')
      .setLabel('Features (one per line)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Feature 1\nFeature 2\nFeature 3')
      .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(applicationNameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(planInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(priceInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(featuresInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

    return modal;
  }
}

module.exports = CommandHandler;
