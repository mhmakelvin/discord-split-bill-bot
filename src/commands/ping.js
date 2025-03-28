const { SlashCommandBuilder } = require("discord.js");

const command = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Provides information about the user.");

const action = async (interaction) => {
  await interaction.reply(
    `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`,
  );
};

module.exports = {
  data: command,
  execute: action,
};
