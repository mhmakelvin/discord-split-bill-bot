import { SlashCommandBuilder, codeBlock } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Provides information for the bot.");

export async function execute(interaction) {
  await interaction.reply({
    content: codeBlock(
      "/activate {name} - Starting using Split Bill Bot\n\n" +
        "/payment {from} {to} {amount} {currency} - Create a payment transaction between 2 users\n\n" +
        "/split_bill {amount} {currency} - Create a transction that split bill between @mentioned users\n\n" +
        "/cancel {transaction_id} - Cancel transaction with specific ID\n\n" +
        "/profile - Get your information",
    ),
    ephemeral: true,
  });
}
