import { SlashCommandBuilder } from "discord.js";
import { isActiveUser } from "../service/user_service.js";
import { getTransactionsByUser } from "../service/transaction_service.js";
import { getMessageForTransactionId } from "../service/message_service.js";

export const data = new SlashCommandBuilder()
  .setName("remind")
  .setDescription("Remind someone about their unapproved transaction")
  .addMentionableOption((option) =>
    option.setName("user").setDescription("User to remind").setRequired(true),
  );

export async function execute(interaction) {
  const serverId = interaction.commandGuildId;
  const user = interaction.options.getMentionable("user");

  const isUserActive = await isActiveUser(serverId, user.id);
  if (!isUserActive) {
    await interaction.reply({
      content: `${user} is not activated for Split Bill Bot in this server`,
      ephemeral: true,
    });
    return;
  }

  const transactions = await getTransactionsByUser(serverId, user.id);

  const unapprovedTransactionMessages = await Promise.all(
    transactions
      .filter((txn) => !txn.data().isCancelled && !txn.data().isApproved)
      .map((txn) =>
        getMessageForTransactionId(interaction.client, txn.data().messageId),
      ),
  );

  if (unapprovedTransactionMessages.length === 0) {
    await interaction.reply({
      content: `${user} has no unapproved transactions`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content:
      `${user} please approve the following transactions:\n\n` +
      unapprovedTransactionMessages.map((msg) => msg.url).join("\n"),
  });
}
