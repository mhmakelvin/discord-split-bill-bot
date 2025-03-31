import {
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("split_bill")
  .setDescription("Add a bill that split between @mentioned");

export async function execute(interaction) {
  const userSelect = new UserSelectMenuBuilder()
    .setCustomId("users")
    .setPlaceholder("Select multiple users.")
    .setMinValues(1)
    .setMaxValues(10);

  const row = new ActionRowBuilder().addComponents(userSelect);

  await interaction.reply({
    content: "Select users:",
    components: [row],
  });
};