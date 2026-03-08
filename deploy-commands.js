import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import url from "url";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(url.pathToFileURL(filePath).href);
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} commands to guild ${process.env.GUILD_ID}`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), // ✅ Correct
      { body: commands }
    );
    console.log("✅ Successfully registered commands.");
  } catch (error) {
    console.error(error);
  }
})();
