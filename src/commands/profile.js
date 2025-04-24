import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  getTransactionsPaidByUser,
  getTransactionsPaidForUser,
} from "../service/transaction_service.js";
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

    const debitTransactions = await getTransactionsPaidByUser(
      interaction.commandGuildId,
      user.id,
    );
    const creditTransactions = await getTransactionsPaidForUser(
      interaction.commandGuildId,
      user.id,
    );

    const balance = new Map();
    for (const txn of debitTransactions) {
      const txnData = txn.data();

      if (txnData.isCancelled || !txnData.isApproved) {
        continue;
      }

      balance.set(
        txnData.currency,
        (balance.get(txnData.currency) || 0) + txnData.amount,
      );
    }

    for (const txn of creditTransactions) {
      const txnData = txn.data();

      if (txnData.isCancelled || !txnData.isApproved) {
        continue;
      }

      const amount = txnData.amount / txnData.borrowers.length;
      balance.set(
        txnData.currency,
        (balance.get(txnData.currency) || 0) - amount,
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

          value: Array.from(balance.entries())
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
