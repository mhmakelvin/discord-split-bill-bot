import * as fs from "fs";
import * as path from "path";
import * as Discord from "discord.js";
import { discordConfig } from "../config.js";
import { updateTransactionMessage } from "./service/message_service.js";

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Discord.Partials.Message,
    Discord.Partials.Channel,
    Discord.Partials.Reaction,
  ],
});

client.commands = new Discord.Collection();
const commandFolderPath = path.join(path.resolve(), "commands");
const commandFiles = fs
  .readdirSync(commandFolderPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandFolderPath, file);
  const command = await import(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`${command.data.name} command added.`);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.on(Discord.Events.MessageReactionAdd, async (reaction, user) => {
  updateTransactionMessage(client, reaction.message.id);
});

client.on(Discord.Events.MessageReactionRemove, async (reaction, user) => {
  updateTransactionMessage(client, reaction.message.id);
});

client.login(discordConfig.token);
