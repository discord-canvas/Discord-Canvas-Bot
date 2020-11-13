'use strict';

const fs = require('fs').promises;
const { Client } = require('discord.js-light');
const sqlite3 = require('sqlite3');

const Canvas = require('./canvas.js');
const CanvasUtils = require('./canvasutils.js');
const { asyncWrap } = require('./utils.js');
const { BOT_PERMISSIONS, BOT_PRESENCE, DB_NAME } = require('./constants.js');

/*******************************************************************************
*** Create bot instance
*******************************************************************************/

const client = new Client({
  cacheGuilds: false,
	cacheChannels: false,
	cacheOverwrites: false,
	cacheRoles: false,
	cacheEmojis: false,
	cachePresences: false,
  presence: BOT_PRESENCE
});

/*******************************************************************************
*** Setup commands
*******************************************************************************/

async function loadCommand(file) {
  const command = require(`./commands/${file}`);
  if (Array.isArray(command.name)) {
    for (let name of command.name) {
      client.commands.set(name.toLowerCase(), {call: command.call, check: command.check, help: command.help});
    }
  } else {
    client.commands.set(command.name.toLowerCase(), {call: command.call, check: command.check, help: command.help});
  }
}

async function loadCommands() {
  const files = await fs.readdir(`${__dirname}/commands`);
  await Promise.all(files.map(loadCommand));
}

/*******************************************************************************
*** Event handlers
*******************************************************************************/

client.on('ready', function() {
  console.log(`Logged in as ${client.user.username}`);
  client.generateInvite({permissions:BOT_PERMISSIONS}).then(link => console.log(`Invite link ${link}`), console.error);
});

client.on('message', asyncWrap(async function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.config.prefix)) return;
  const parts = message.content.substring(client.config.prefix.length).trim().split(' ');
  const command = parts.splice(0, 1)[0].trim().toLowerCase();

  if (client.commands.has(command)) {
    console.log(`${message.author.id} :: ${command} / ${parts.map(v => `"${v}"`).join(', ')}`);

    const cmd = client.commands.get(command);

    if (!(cmd.check instanceof Function) || cmd.check(message)) {
      try {
        await cmd.call(message, parts);
      } catch(e) {
        console.error(`Error running command ${command}\n`, e);
        await message.channel.send('Sorry an error occured, please try again later');
      }
    } else {
      await message.channel.send('Sorry you don\'t have permission to use this command');
    }
  }
}));

client.on('close', function() {
  client.db.close();
})

/*******************************************************************************
*** Startup the bot
*******************************************************************************/

function awaitOpen(database) {
  return new Promise((resolve, reject) => {
    database.once('error', reject);
    database.once('open', resolve);
  });
}

module.exports = async function(botToken, canvasToken, config) {
  const db = new sqlite3.Database(DB_NAME, sqlite3.OPEN_READWRITE);
  await awaitOpen(db);
  db.on('error', console.error);
  const canvas = new Canvas(canvasToken, config);
  const canvasUtils = new CanvasUtils(canvas, config.overrides);
  Object.defineProperties(client, {
    config: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze(config)
    },
    canvas: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: canvas
    },
    canvasUtils: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: canvasUtils
    },
    db: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: db
    },
    commands: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map()
    }
  });
  await loadCommands();
  await client.login(botToken);
  return client;
}
