import { SlashCommandBuilder } from "discord.js";
import { currencyList } from "../service/currency_service.js";
import {
  addTransaction,
  deleteTransaction,
} from "../service/transaction_service.js";
import { updateTransactionMessage } from "../service/message_service.js";

const currencyOptions = [];
for (const currency of currencyList) {
  currencyOptions.push({ name: currency, value: currency });
}

export const data = new SlashCommandBuilder()
  .setName("payment")
  .setDescription("Add a direct payment between 2 users")
  .addMentionableOption((option) =>
    option
      .setName("from")
      .setDescription("Mention who are paying")
      .setRequired(true),
  )
  .addMentionableOption((option) =>
    option
      .setName("to")
      .setDescription("Mention who are recieveing the payment")
      .setRequired(true),
  )
  .addNumberOption((option) =>
    option.setName("amount").setDescription("Amount").setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("currency")
      .setDescription("Currency")
      .setRequired(true)
      .addChoices(currencyOptions),
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("Description")
      .setRequired(false),
  );

export async function execute(interaction) {
  const serverId = interaction.commandGuildId;
  const author = interaction.user;
  const fromUser = interaction.options.getUser("from");
  const toUser = interaction.options.getUser("to");
  const amount = interaction.options.getNumber("amount");
  const currency = interaction.options.getString("currency");
  const description = interaction.options.getString("description");

  const resp = await interaction.reply({
    content: "Request received",
    withResponse: true,
  });
  const msg = resp.resource.message;

  try {
    await addTransaction(
      serverId,
      author,
      fromUser,
      [toUser],
      amount,
      currency,
      description || "",
      msg.id,
    );

    msg.react("✅");
    await updateTransactionMessage(interaction.client, msg.id);

    msg.pin();
  } catch (e) {
    console.log(e);
    deleteTransaction(msg.id);
    msg.edit(`Error occurred when processing request: ${e.message}`);
  }
}
