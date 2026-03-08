import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Send the ticket panel embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Center")
      .setDescription(
        "📩 **Need assistance?**\n" +
        "Our support team is here to help with anything you need.\n\n" +
        "Please select the type of ticket that best fits your situation below.\n\n" +
        "> 🎟️ **Support** — General questions or help\n" +
        "> 🚔 **Report** — Report a player or issue\n" +
        "> 🐞 **Bug Report** — Report server or script bugs"
      )
      .setColor(0x2b2d31)
      .setFooter({ text: "Corevia Global | Professional Support", iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_support").setLabel("Support Ticket").setEmoji("🎟️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_report").setLabel("Report Ticket").setEmoji("🚔").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket_bug").setLabel("Bug Report").setEmoji("🐞").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: "✅ Ticket panel sent!", ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [buttons] });
  },
};
