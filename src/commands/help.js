import { SlashCommandBuilder, codeBlock } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Provides information for the bot.");

export async function execute(interaction) {
  await interaction.reply({
    content: codeBlock(
      "/activate {name} - Starting using Split Bill Bot\n\n" +
        "/settlement {from} {to} {amount} {currency} - Create a transaction representing from_user giving money to to_user \n\n" +
        "/split_bill {amount} {currency} {description} {paid_by} - Create a transction that split bill between @mentioned users\n\n" +
        "/cancel {transaction_id} - Cancel transaction with specific ID\n\n" +
        "/remind {user} - Reminding someone for unapproved transactions\n\n" +
        "/profile {user} - Get information",
    ),
    ephemeral: true,
  });
}
