import {
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import { isActiveUser } from "../service/user_service.js";
import { currencyList } from "../service/currency_service.js";
import {
  addTransaction,
  deleteTransaction,
} from "../service/transaction_service.js";
import { approvedEmoji } from "../constants.js";

const currencyOptions = [];
for (const currency of currencyList) {
  currencyOptions.push({ name: currency, value: currency });
}

export const data = new SlashCommandBuilder()
  .setName("split_bill")
  .setDescription("Add a bill that split between @mentioned")
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
  )
  .addMentionableOption((option) =>
    option
      .setName("paid_by")
      .setDescription("Mention who are paying the bill")
      .setRequired(false),
  );

export async function execute(interaction) {
  const serverId = interaction.commandGuildId;
  const payingUser =
    interaction.options.getMentionable("paid_by") || interaction.user;
  console.log(payingUser);

  const isAuthorActive = await isActiveUser(serverId, interaction.user.id);
  if (!isAuthorActive) {
    await interaction.reply({
      content: `${interaction.user} is not activated for Split Bill Bot in this server`,
      ephemeral: true,
    });
    return;
  }

  const isPayingUserActive = await isActiveUser(serverId, payingUser.id);
  if (!isPayingUserActive) {
    await interaction.reply({
      content: `${payingUser} is not activated for Split Bill Bot in this server`,
      ephemeral: true,
    });
    return;
  }

  const userSelect = new UserSelectMenuBuilder()
    .setCustomId("users")
    .setPlaceholder("Select multiple users.")
    .setMinValues(1)
    .setMaxValues(10);

  const row = new ActionRowBuilder().addComponents(userSelect);

  const reply = await interaction.reply({
    content: "Select users:",
    components: [row],
    ephemeral: true,
    withResponse: true,
  });

  const msg = reply.resource.message;

  let mentionedUsers = [];
  try {
    const response = await msg.awaitMessageComponent({ time: 60_000 });
    mentionedUsers = Array.from(response.users.values());
  } catch (e) {
    console.log(e);
    await interaction.editReply({
      content: "User selection not received within 1 minute, cancelling",
      components: [],
    });
    return;
  }

  const txnMsg = await interaction.followUp({
    content: `Creating Transaction`,
  });

  try {
    const inactiveUserList = [];
    for (const user of mentionedUsers) {
      const isActive = await isActiveUser(serverId, user.id);
      if (!isActive) {
        inactiveUserList.push(user);
      }
    }

    if (inactiveUserList.length > 0) {
      await txnMsg.edit({
        content: `${inactiveUserList} is not activated for Split Bill Bot in this server`,
      });
      return;
    }

    let amount = Math.ceil(interaction.options.getNumber("amount"));
    const currency = interaction.options.getString("currency");
    const description = interaction.options.getString("description");

    const cnt = mentionedUsers.length;
    amount = amount + ((cnt - (amount % cnt)) % cnt); // Round up amount to nearest multiple of cnt

    await addTransaction(
      serverId,
      interaction.user,
      payingUser,
      mentionedUsers,
      amount,
      currency,
      description || "",
      interaction.channel.id,
      txnMsg.id,
    );

    txnMsg.edit(
      `${interaction.user} has initiated a transaction of ${amount} ${currency} splitting between ${mentionedUsers}\n Please confirm by reacting with ${approvedEmoji}`,
    );
    txnMsg.react(approvedEmoji);
    txnMsg.pin();

    interaction.deleteReply();
  } catch (e) {
    deleteTransaction(txnMsg.id);
    await txnMsg.edit({
      content: "Error when creating transaction: " + e.message,
    });
  }
}
