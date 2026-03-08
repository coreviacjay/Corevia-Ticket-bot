import { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fs from "fs";
import path from "path";
import url from "url";
import dotenv from "dotenv";

// --- ES module __dirname workaround ---
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from bot folder
dotenv.config({ path: path.join(__dirname, ".env") });

// --- Create client ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// --- Load Commands ---
const commandsPath = path.join(__dirname, "commands");
if (!fs.existsSync(commandsPath)) {
  console.error("❌ Commands folder not found at:", commandsPath);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(url.pathToFileURL(filePath).href);
  client.commands.set(command.default.data.name, command.default);
  console.log(`✅ Loaded command: ${file}`);
}

// --- Ready ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Interactions ---
client.on("interactionCreate", async interaction => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction, client);
  }

  // Buttons
  if (interaction.isButton()) {
    const staffRole = interaction.guild.roles.cache.get(process.env.STAFF_ROLE_ID);
    const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);

    if (!staffRole || !logChannel) return interaction.reply({ content: "❌ Staff role or log channel not found!", ephemeral: true });

    const ticketTypes = {
      ticket_support: { emoji: "🎟️", name: "support" },
      ticket_report: { emoji: "🚔", name: "report" },
      ticket_bug: { emoji: "🐞", name: "bug" },
    };

    // --- Create Ticket ---
    if (ticketTypes[interaction.customId]) {
      const type = ticketTypes[interaction.customId];

      // Prevent multiple tickets
      const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${type.name}-${interaction.user.username}`);
      if (existing) return interaction.reply({ content: `❌ You already have an open ${type.name} ticket: ${existing}`, ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${type.name}-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
          { id: staffRole.id, allow: ["ViewChannel", "SendMessages"] },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`${type.emoji} ${type.name.charAt(0).toUpperCase() + type.name.slice(1)} Ticket`)
        .setDescription(`Hello ${interaction.user}, please describe your issue below.\nA staff member will respond shortly.`)
        .setColor(0x2b2d31)
        .setFooter({ text: "Corevia Global Ticket System" })
        .setTimestamp();

      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [closeButton] });
      await interaction.reply({ content: `✅ Your ${type.name} ticket has been created: ${channel}`, ephemeral: true });
    }

    // --- Close Ticket ---
    if (interaction.customId === "close_ticket") {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(m => `${m.author.tag}: ${m.content || "[Embed/Attachment]"}`).join("\n");
      const filePath = path.join(__dirname, `transcript-${interaction.channel.name}.txt`);
      fs.writeFileSync(filePath, transcript);

      const logEmbed = new EmbedBuilder()
        .setTitle("📁 Ticket Closed")
        .addFields(
          { name: "Ticket", value: `${interaction.channel.name}`, inline: true },
          { name: "Closed by", value: `${interaction.user}`, inline: true },
          { name: "Transcript", value: "Attached below" }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed], files: [filePath] });
      await interaction.reply({ content: "🗑️ Ticket closed and transcript saved.", ephemeral: true });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
        fs.unlinkSync(filePath);
      }, 5000);
    }
  }
});

// --- Login ---
client.login(process.env.TOKEN);
