import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Provides information about the user.");

export async function execute(interaction) {
  await interaction.reply({
    content: `Discord Split Bill Bot is active!`,
    ephemeral: true,
  });
}
