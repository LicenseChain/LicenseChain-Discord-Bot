const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLinkedUser } = require('../client/DashboardClient');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show your profile and linked LicenseChain account (tier/role if linked)'),

  async execute(interaction, licenseClient, dbManager) {
    await interaction.deferReply();

    try {
      const user = interaction.user;
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('👤 Your Profile')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Discord User', value: user.tag, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Joined Discord', value: user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A', inline: true }
        )
        .setTimestamp();

      let linked = null;
      try {
        linked = await getLinkedUser(user.id);
      } catch (_) {
        // optional
      }

      if (linked && linked.linked) {
        const tier = (linked.tier || 'free').toLowerCase();
        const role = (linked.role || 'USER').toLowerCase();
        embed.addFields(
          { name: '🔗 LicenseChain Account', value: 'Linked', inline: false },
          { name: 'Tier', value: tier, inline: true },
          { name: 'Role', value: role, inline: true }
        );
        if (linked.name) embed.addFields({ name: 'Name', value: linked.name, inline: true });
        if (linked.email) embed.addFields({ name: 'Email', value: linked.email, inline: true });
      } else {
        embed.addFields({
          name: '🔗 LicenseChain Account',
          value: 'Not linked. Link your Discord account in [Dashboard Settings](https://dashboard.licensechain.app/settings) to see your tier and role here.',
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Profile command error:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('Failed to load profile.')
        .setTimestamp();
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
