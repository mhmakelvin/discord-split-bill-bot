import {
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import { isActiveUser } from "../service/user_service.js";
import { currencyList } from "../service/currency_service.js";
import { addTransaction, deleteTransaction } from "../service/transaction_service.js";
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
  );


export async function execute(interaction) {
  const serverId = interaction.commandGuildId;

  if (!isActiveUser(serverId, interaction.user.username)) {
    await interaction.reply( `${interaction.user} is not activated for Split Bill Bot in this server`,
 );
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
    withResponse: true,
  });

  const msg = reply.resource.message;

  try {
    const response = await msg.awaitMessageComponent({ time: 60_000 });

    const inactiveUserList = [];
    for (var [id, user] of response.users.entries()) {
      const isActive = await isActiveUser(serverId, user.username);
      if (!isActive) {
        inactiveUserList.push(user);
      }
    }

    if (inactiveUserList.length > 0) {
      await interaction.editReply({
        content:       `${inactiveUserList} is not activated for Split Bill Bot in this server`,

        components: [],
      });
      return;
    }

    let amount = Math.ceil(interaction.options.getNumber("amount"));
    const currency = interaction.options.getString("currency");
    const description = interaction.options.getString("description");

    const cnt = response.users.size;
    amount = amount + (cnt - amount % cnt) % cnt; // Round up amount to nearest multiple of cnt
      
    await addTransaction(
      serverId,
      interaction.user,
      interaction.user,
      response.users.values(),
      amount,
      currency,
      description || "",
      msg.id,
    );

    msg.react(approvedEmoji);
    msg.pin();

    await interaction.editReply({
      content: `${interaction.user} has initiated a transaction of ${amount} ${currency} splitting between ${Array.from(response.users.values())}\n Please confirm by reacting with ${approvedEmoji}`,
      components: [],
    });
  } catch (e) {
    console.log(e)
    deleteTransaction(msg.id);
    await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
  }
}
