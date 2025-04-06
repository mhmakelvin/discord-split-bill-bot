import { SlashCommandBuilder } from "discord.js";
import { addPermittedUser } from "../service/user_service.js";

export const data = new SlashCommandBuilder()
  .setName("add_user")
  .setDescription("Add yourself into SplitBill Bot user list")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Display name for user")
      .setRequired(false),
  );

export async function execute(interaction) {
  const userToAdd = interaction.user;
  const displayName = interaction.options.getString("name");

  try {
    await addPermittedUser(userToAdd.username, displayName);
    interaction.reply(
      `User ${userToAdd} successfully added as ${displayName || userToAdd.username}`,
    );
  } catch (e) {
    interaction.reply("Error adding new user");
    console.error("Error adding new user: ", e);
  }
}
