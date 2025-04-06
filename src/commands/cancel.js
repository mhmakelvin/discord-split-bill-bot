import { SlashCommandBuilder } from "discord.js";
import { deleteTransaction } from "../service/transaction_service.js";

export const data = new SlashCommandBuilder()
  .setName("cancel")
  .setDescription("Cancel unprocessed transaction with given ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("Transaction ID").setRequired(true),
  );

export async function execute(interaction) {
  const txnId = interaction.options.getString("id");
  try {
    await deleteTransaction(txnId);
    await interaction.reply(`Cancelled transaction ${txnId} successfully`);
  } catch (e) {
    interaction.reply({
      content: `Error when deleting transaction: ${e.message}`,
    });
  }
}
