/**
 * Analytics Commands
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('View license analytics and statistics')
    .addSubcommand(subcommand =>
      subcommand
        .setName('overview')
        .setDescription('Get overview of your license analytics')
        .addStringOption(option =>
          option
            .setName('period')
            .setDescription('Time period for analytics')
            .setChoices(
              { name: 'Last 7 days', value: '7d' },
              { name: 'Last 30 days', value: '30d' },
              { name: 'Last 90 days', value: '90d' },
              { name: 'Last year', value: '1y' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('license')
        .setDescription('Get analytics for a specific license')
        .addStringOption(option =>
          option
            .setName('key')
            .setDescription('License key to analyze')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('period')
            .setDescription('Time period for analytics')
            .setChoices(
              { name: 'Last 7 days', value: '7d' },
              { name: 'Last 30 days', value: '30d' },
              { name: 'Last 90 days', value: '90d' },
              { name: 'Last year', value: '1y' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('usage')
        .setDescription('View usage statistics')
        .addStringOption(option =>
          option
            .setName('period')
            .setDescription('Time period for usage stats')
            .setChoices(
              { name: 'Last 7 days', value: '7d' },
              { name: 'Last 30 days', value: '30d' },
              { name: 'Last 90 days', value: '90d' },
              { name: 'Last year', value: '1y' }
            )
        )
    ),

  async execute(interaction, licenseClient, dbManager) {
    const subcommand = interaction.options.getSubcommand();
    const period = interaction.options.getString('period') || '30d';

    await interaction.deferReply();

    try {
      switch (subcommand) {
        case 'overview':
          await this.handleOverview(interaction, licenseClient, period);
          break;
        case 'license':
          await this.handleLicenseAnalytics(interaction, licenseClient, period);
          break;
        case 'usage':
          await this.handleUsageStats(interaction, licenseClient, dbManager, period);
          break;
        default:
          await interaction.editReply({ content: 'Unknown subcommand!', ephemeral: true });
      }
    } catch (error) {
      console.error('Error in analytics command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your request.')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleOverview(interaction, licenseClient, period) {
    try {
      const analytics = await licenseClient.getAnalytics(period, ['revenue', 'licenses', 'users', 'conversions']);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Analytics Overview')
        .setDescription(`Analytics for the last ${this.getPeriodText(period)}`)
        .addFields(
          { name: 'Total Revenue', value: `$${analytics.revenue?.total || 0}`, inline: true },
          { name: 'Active Licenses', value: analytics.licenses?.active?.toString() || '0', inline: true },
          { name: 'Total Users', value: analytics.users?.total?.toString() || '0', inline: true },
          { name: 'Conversion Rate', value: `${analytics.conversions?.rate || 0}%`, inline: true },
          { name: 'Growth Rate', value: `${analytics.growth?.rate || 0}%`, inline: true },
          { name: 'Top Feature', value: analytics.topFeature || 'N/A', inline: true }
        )
        .setTimestamp();

      if (analytics.revenue?.growth) {
        embed.addFields({ name: 'Revenue Growth', value: `${analytics.revenue.growth}%`, inline: true });
      }

      if (analytics.licenses?.growth) {
        embed.addFields({ name: 'License Growth', value: `${analytics.licenses.growth}%`, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Analytics Error')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleLicenseAnalytics(interaction, licenseClient, period) {
    const licenseKey = interaction.options.getString('key');

    try {
      // First validate the license
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

      // Get license analytics
      const analytics = await licenseClient.getLicenseAnalytics(validation.licenseId || 'unknown', period);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📊 License Analytics')
        .setDescription(`Analytics for license \`${licenseKey}\` (${this.getPeriodText(period)})`)
        .addFields(
          { name: 'Total Validations', value: analytics.totalValidations?.toString() || '0', inline: true },
          { name: 'Unique Users', value: analytics.uniqueUsers?.toString() || '0', inline: true },
          { name: 'Avg. Daily Validations', value: analytics.averageValidationsPerDay?.toString() || '0', inline: true },
          { name: 'Peak Usage', value: analytics.peakUsage ? `${analytics.peakUsage.validations} on ${analytics.peakUsage.date}` : 'N/A', inline: false }
        )
        .setTimestamp();

      if (analytics.usageByDay && analytics.usageByDay.length > 0) {
        const recentUsage = analytics.usageByDay.slice(-7);
        const usageText = recentUsage.map(day => `${day.date}: ${day.validations}`).join('\n');
        embed.addFields({ name: 'Recent Usage (Last 7 Days)', value: `\`\`\`\n${usageText}\n\`\`\``, inline: false });
      }

      if (analytics.topFeatures && analytics.topFeatures.length > 0) {
        const featuresText = analytics.topFeatures.map(feature => `${feature.name}: ${feature.usage}%`).join('\n');
        embed.addFields({ name: 'Top Features', value: `\`\`\`\n${featuresText}\n\`\`\``, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Analytics Error')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async handleUsageStats(interaction, licenseClient, dbManager, period) {
    try {
      const userId = interaction.user.id;
      const usageStats = await dbManager.getUserUsageStats(userId, period);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📈 Usage Statistics')
        .setDescription(`Your usage statistics for the last ${this.getPeriodText(period)}`)
        .addFields(
          { name: 'Total Validations', value: usageStats.totalValidations?.toString() || '0', inline: true },
          { name: 'Active Licenses', value: usageStats.activeLicenses?.toString() || '0', inline: true },
          { name: 'Most Used License', value: usageStats.mostUsedLicense || 'N/A', inline: true },
          { name: 'Average Daily Usage', value: usageStats.averageDaily?.toString() || '0', inline: true },
          { name: 'Peak Usage Day', value: usageStats.peakDay || 'N/A', inline: true },
          { name: 'Usage Trend', value: usageStats.trend || 'Stable', inline: true }
        )
        .setTimestamp();

      if (usageStats.licenseBreakdown && usageStats.licenseBreakdown.length > 0) {
        const breakdownText = usageStats.licenseBreakdown
          .map(license => `${license.name}: ${license.validations} validations`)
          .join('\n');
        embed.addFields({ name: 'License Breakdown', value: `\`\`\`\n${breakdownText}\n\`\`\``, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Usage Stats Error')
        .setDescription(error.message)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  getPeriodText(period) {
    const periodMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    };
    return periodMap[period] || '30 days';
  }
};
