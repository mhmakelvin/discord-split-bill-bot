import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser } from "../service/user_service.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Provides information about the user.")
  .addMentionableOption((option) =>
    option
      .setName("user")
      .setDescription("Mention who to get profile for")
      .setRequired(false),
  );

export async function execute(interaction) {
  try {
    const user = interaction.options.getUser("user") || interaction.user;
    const userData = await getUser(interaction.commandGuildId, user.id);

    if (userData === null) {
      throw new Error(
        `${user} is not activated for Split Bill Bot in this server`,
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(`${userData.data().name}'s Profile`)
      .setFields(
        { name: "Discord ID", value: user.username },
        {
          name: "Display Name",
          value: userData.data().name,
        },
        {
          name: "Balance",

          value: Object.entries(userData.data().balance)
            .map(([currency, amount]) => `${currency}: ${amount}`)
            .join("\n"),
        },
      )
      .setTimestamp();

    interaction.reply({
      embeds: [embed],
    });
  } catch (e) {
    console.log(e);
    interaction.reply({
      content: `Error when fetching profile: ${e.message}`,
    });
  }
}
