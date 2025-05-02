import { SlashCommandBuilder } from "discord.js";
import { cancelTransaction } from "../service/transaction_service.js";
import { updateTransactionMessageForCancellation } from "../service/message_service.js";

export const data = new SlashCommandBuilder()
  .setName("cancel")
  .setDescription("Cancel unprocessed transaction with given ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("Transaction ID").setRequired(true),
  );

export async function execute(interaction) {
  const txnId = interaction.options.getString("id");

  try {
    if (!/^[0-9]+$/.test(txnId)) {
      interaction.reply("Invalid transaction ID. It should be a number");
      return;
    }

    await cancelTransaction(txnId, interaction.user.id);
    await updateTransactionMessageForCancellation(interaction.client, txnId);
    await interaction.reply(`Cancelled transaction ${txnId} successfully`);
  } catch (e) {
    interaction.reply({
      content: `Error when cancelling transaction: ${e.message}`,
    });
  }
}
