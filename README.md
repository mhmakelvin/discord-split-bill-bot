# Discord Spill Bill Bot


# Intro
This is an discord bot designed to help users efficiently split bills and record payments, reducing the need for real-life transactions. Key features include:

 - Splitting bills evenly between users.

 - Recoard payments made to others

 - Multi-currency support to handle expenses among international users

# Installation

Installing dependencies
```sh
yarn install
```

Start bot
```sh
yarn start
```

# Start using bot
Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)

Create config.json with following content under root folder
```
{
	"token": "your-bot-token",
    "clientId": "your-bot-client-id",
    "guildId": "your-channel-id"
}
```

# Commands

`/ping` - Check whether bot is active

`/split_bill` - Split a bill between selected users

`/payment {fromUser} {toUser} {amount} {currency}` - Record a payment between users