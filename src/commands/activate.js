import { SlashCommandBuilder } from "discord.js";
import { activateUser } from "../service/user_service.js";

export const data = new SlashCommandBuilder()
  .setName("activate")
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
    if (/^.*\<((@(&)?)|#)[0-9]+\>.*$/.test(displayName)) {
      interaction.reply(
        "Invalid display name. Please try not to use mentionable as display name",
      );
      return;
    }

    if (displayName === "@here" || displayName === "@everyone") {
      interaction.reply(
        "Invalid display name. Please try not to use mentionable as display name",
      );
      return;
    }

    if (displayName !== null && displayName.length > 256) {
      interaction.reply(
        "Invalid display name. Please enter a string less than 256 characters",
      );
      return;
    }

    await activateUser(interaction.commandGuildId, userToAdd, displayName);
    interaction.reply(
      `User ${userToAdd} successfully added as ${displayName || userToAdd.username}`,
    );
  } catch (e) {
    interaction.reply("Error adding new user");
    console.error("Error adding new user: ", e);
  }
}
