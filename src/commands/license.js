/**
 * License Management Commands
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Validator = require('../utils/Validator');
const PermissionManager = require('../utils/PermissionManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('Manage license keys')
    .addSubcommand(subcommand =>
      subcommand
        .setName('validate')
        .setDescription('Validate a license key')
        .addStringOption(option =>
          option
            .setName('key')
            .setDescription('License key to validate')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get license information')
        .addStringOption(option =>
          option
            .setName('key')
            .setDescription('License key to get info for')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List your licenses')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Page number')
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new license (opens modal)')
    ),

  async execute(interaction, licenseClient, dbManager) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'validate':
          await this.handleValidate(interaction, licenseClient, dbManager);
          break;
        case 'info':
          await this.handleInfo(interaction, licenseClient, dbManager);
          break;
        case 'list':
          await this.handleList(interaction, licenseClient, dbManager);
          break;
        case 'create':
          await this.handleCreate(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown subcommand!', flags: 64 });
      }
    } catch (error) {
      console.error('Error in license command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your request.')
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }
  },

  async handleValidate(interaction, licenseClient, dbManager) {
    await interaction.deferReply();

    try {
      // Validate and sanitize input
      const rawKey = interaction.options.getString('key');
      const licenseKey = Validator.validateLicenseKey(rawKey);

      // Log validation attempt
      if (dbManager) {
        await dbManager.logValidation(interaction.user.id, licenseKey, false); // Will update after validation
      }

      const result = await licenseClient.validateLicense(licenseKey);

      // Update validation log
      if (dbManager && result.valid) {
        await dbManager.logValidation(interaction.user.id, licenseKey, true);
      }

      const embed = new EmbedBuilder()
        .setColor(result.valid ? '#00ff00' : '#ff0000')
        .setTitle(result.valid ? '✅ License Valid' : '❌ License Invalid')
        .addFields(
          { name: 'License Key', value: `\`${Validator.sanitizeForDisplay(licenseKey)}\``, inline: true },
          { name: 'Status', value: result.valid ? 'Active' : 'Invalid', inline: true },
          { name: 'Message', value: Validator.sanitizeForDisplay(result.message || 'No additional information'), inline: false }
        )
        .setTimestamp();

      if (result.valid && result.expiresAt) {
        embed.addFields({ name: 'Expires', value: new Date(result.expiresAt).toLocaleDateString(), inline: true });
      }

      if (result.features && result.features.length > 0) {
        embed.addFields({ name: 'Features', value: result.features.join(', '), inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Validation Failed')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleInfo(interaction, licenseClient) {
    await interaction.deferReply();

    try {
      // Validate and sanitize input
      const rawKey = interaction.options.getString('key');
      const licenseKey = Validator.validateLicenseKey(rawKey);

      // First validate the license to get basic info
      const validation = await licenseClient.validateLicense(licenseKey);
      
      if (!validation.valid) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ License Not Found')
          .setDescription('The provided license key is invalid or not found.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Get detailed license information
      const licenseInfo = await licenseClient.getLicense(validation.licenseId || 'unknown');

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 License Information')
        .addFields(
          { name: 'License Key', value: `\`${Validator.sanitizeForDisplay(licenseKey)}\``, inline: true },
          { name: 'Application', value: Validator.sanitizeForDisplay(licenseInfo.applicationName || 'Unknown'), inline: true },
          { name: 'Status', value: Validator.sanitizeForDisplay(licenseInfo.status || 'Unknown'), inline: true },
          { name: 'Plan', value: Validator.sanitizeForDisplay(licenseInfo.plan || 'Unknown'), inline: true },
          { name: 'Price', value: `$${licenseInfo.price || 0}`, inline: true },
          { name: 'Created', value: licenseInfo.createdAt ? new Date(licenseInfo.createdAt).toLocaleDateString() : 'Unknown', inline: true }
        )
        .setTimestamp();

      if (licenseInfo.expiresAt) {
        embed.addFields({ name: 'Expires', value: new Date(licenseInfo.expiresAt).toLocaleDateString(), inline: true });
      }

      if (licenseInfo.features && licenseInfo.features.length > 0) {
        embed.addFields({ name: 'Features', value: licenseInfo.features.join('\n'), inline: false });
      }

      if (licenseInfo.usage) {
        embed.addFields(
          { name: 'Total Validations', value: licenseInfo.usage.totalValidations?.toString() || '0', inline: true },
          { name: 'Last Validated', value: licenseInfo.usage.lastValidated ? new Date(licenseInfo.usage.lastValidated).toLocaleDateString() : 'Never', inline: true }
        );
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleList(interaction, licenseClient, dbManager) {
    await interaction.deferReply();

    try {
      // Validate page number
      const rawPage = interaction.options.getInteger('page') || 1;
      const page = Validator.validateInteger(rawPage, 1, 1000);
      const userId = Validator.validateUserId(interaction.user.id);

      // Ensure user exists in database
      if (dbManager) {
        try {
          await dbManager.getOrCreateUser({
            id: userId,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator
          });
        } catch (userError) {
          console.warn('Could not create/get user:', userError.message);
        }
      }

      // Try to get licenses from API first, then fallback to database
      let licenses = [];
      
      if (licenseClient) {
        try {
          // Try API first - getUserLicenses filters by email/issuedTo, so we need to pass the right identifier
          // For Discord, we might need to use the user's email or Discord ID as identifier
          const apiLicenses = await licenseClient.getUserLicenses(userId);
          if (apiLicenses && apiLicenses.length > 0) {
            licenses = apiLicenses.map(license => ({
              key: license.key || license.licenseKey || license.id,
              status: license.status || 'active',
              applicationName: license.applicationName || license.appName || license.app?.name || 'LicenseChain',
              plan: license.plan || 'standard',
              expiresAt: license.expiresAt || license.expires_at,
              createdAt: license.createdAt || license.created_at
            }));
          }
        } catch (apiError) {
          console.warn('Could not fetch licenses from API:', apiError.message);
        }
      }

      // Fallback to database if API didn't return licenses
      if (licenses.length === 0 && dbManager) {
        try {
          licenses = await dbManager.getUserLicenses(userId);
        } catch (dbError) {
          console.warn('Could not fetch licenses from database:', dbError.message);
        }
      }
      
      if (!licenses || licenses.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ffaa00')
          .setTitle('📋 Your Licenses')
          .setDescription('You don\'t have any licenses yet.')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const itemsPerPage = 5;
      const totalPages = Math.ceil(licenses.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageLicenses = licenses.slice(startIndex, endIndex);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Your Licenses')
        .setDescription(`Page ${page} of ${totalPages}`)
        .setTimestamp();

      pageLicenses.forEach((license, index) => {
        const status = license.status === 'active' ? '✅' : license.status === 'expired' ? '❌' : '⚠️';
        const expires = license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never';
        
        embed.addFields({
          name: `${status} ${license.applicationName || 'Unknown App'}`,
          value: `**Key:** \`${license.key}\`\n**Plan:** ${license.plan}\n**Expires:** ${expires}`,
          inline: true
        });
      });

      if (totalPages > 1) {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`license_list_${page - 1}`)
              .setLabel('◀️ Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page <= 1),
            new ButtonBuilder()
              .setCustomId(`license_list_${page + 1}`)
              .setLabel('Next ▶️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= totalPages)
          );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleCreate(interaction) {
    try {
      // Check permissions - only admins can create licenses
      const permissionManager = new PermissionManager(interaction.client);
      await permissionManager.requirePermission(interaction.member, 'admin');

      const CommandHandler = require('../handlers/CommandHandler');
      const commandHandler = new CommandHandler(interaction.client, null, null);
      const modal = commandHandler.createLicenseModal();
      await interaction.showModal(modal);
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Permission Denied')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }
  }
};
