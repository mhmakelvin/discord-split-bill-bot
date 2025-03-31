import { SlashCommandBuilder, MessageFlags } from "discord.js"
import { currencyList } from "../service/currency_service.js"
import { isPermittedUser } from "../service/user_service.js"

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
  );

export async function execute(interaction) {
  const fromUser = interaction.options.getUser("from");
  const toUser = interaction.options.getUser("to");
  const amount = interaction.options.getNumber("amount");
  const currency = interaction.options.getString("currency");

  /*
  if (
    !isPermittedUser(fromUser.username) ||
    !isPermittedUser(toUser.username)
  ) {
    interaction.reply({ content: "Invalid user", flags : MessageFlags.Ephemeral });
    return;
  }
    */

  const msg = await interaction.reply("Request received");
  console.log(msg)
};