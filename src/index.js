'use strict';

const fs = require('fs').promises;
const { Client } = require('discord.js-light');
const sqlite3 = require('sqlite3');

const Canvas = require('./canvas.js');
const Sam = require('./sam.js');
const CanvasUtils = require('./canvasutils.js');
const { assignmentAutoUpdate } = require('./autoupdate.js');
const { asyncWrap, unwrapSync, ipcSend } = require('./utils.js');
const { BOT_PERMISSIONS, BOT_PRESENCE, DB_NAME } = require('./constants.js');
const { Config, enforceType } = require('./types.js');

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
  presence: BOT_PRESENCE,
  disableMentions: 'everyone',
});

/*******************************************************************************
*** Setup commands
*******************************************************************************/

async function loadCommand(file) {
  const command = require(`./commands/${file.name}`);
  if (Array.isArray(command.name)) {
    for (let name of command.name) {
      client.commands.set(name.toLowerCase(), {call: command.call, check: command.check, help: command.help, name: command.name});
    }
  } else {
    client.commands.set(command.name.toLowerCase(), {call: command.call, check: command.check, help: command.help, name: [command.name]});
  }
}

async function loadCommands() {
  const files = (await fs.readdir(`${__dirname}/commands`, { withFileTypes: true })).filter(ent => ent.isFile() && ent.name.endsWith('.js'));
  await Promise.all(files.map(loadCommand));
}

/*******************************************************************************
*** Event handlers
*******************************************************************************/

client.on('ready', function() {
  ipcSend({ t: 'ready', id: client.user.id }).then(null,console.error);
  console.log(`Logged in as ${client.user.username}`);
  client.generateInvite({permissions:BOT_PERMISSIONS}).then(link => console.log(`Invite link ${link}`), console.error);
});

client.on('message', asyncWrap(async function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.config.prefix)) return;
  const parts = message.content.substring(client.config.prefix.length).trim().split(/  */);
  const command = parts.splice(0, 1)[0].trim().toLowerCase();

  if (client.commands.has(command)) {
    console.log(`${message.author.id} :: ${command} / ${parts.map(v => `"${v}"`).join(', ')}`);

    const cmd = client.commands.get(command);

    if (!(cmd.check instanceof Function) || (await unwrapSync(cmd.check(message))) === true) {
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

client.once('close', function() {
  client.db.close(function(err) {
    if (err) console.error(err);
    process.exit(0);
  });
});


/*******************************************************************************
*** Startup the bot
*******************************************************************************/

function awaitOpen(database) {
  return new Promise((resolve, reject) => {
    database.once('error', reject);
    database.once('open', resolve);
  });
}

const startBot = module.exports = async function(botToken, canvasToken, samToken, config) {
  const db = new sqlite3.Database(DB_NAME, sqlite3.OPEN_READWRITE);
  await awaitOpen(db);
  db.on('error', console.error);
  config = enforceType(Config, config);
  const canvas = new Canvas(canvasToken, config);
  const sam = new Sam(samToken, config);
  const canvasUtils = new CanvasUtils(canvas, sam, config.overrides);
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
  if (config.automated_assignments.length > 0) {
    await assignmentAutoUpdate(client);
    client.setInterval(asyncWrap(assignmentAutoUpdate), 1000 * 60 * 30, client);
  }
  return client;
}

/*******************************************************************************
*** IPC handlers
*******************************************************************************/

process.on('message', asyncWrap(async function(message) {
  switch(message.t) {
    case 'edit': {
      await client.channels.forge(message.chan).messages.forge(message.msg).edit(message.content);
      break;
    }
    case 'close': {
      shutdown();
      break;
    }
  }
}));

/*******************************************************************************
*** Startup
*******************************************************************************/

let hasShutdown = true;

function shutdown() {
  if (hasShutdown) return;
  hasShutdown = true;
  const shardCount = client.ws.shards.size;
  console.log(`Shutting down ${shardCount} shards`);
  let shardsDestroyed = 0, closed = false;
  client.on('shardDisconnect', function() {
    if (shardsDestroyed++ >= shardCount && !closed) {
      closed = true;
      console.log('All shards closed shutting down db');
      client.db.close(function(err) {
        if (err) {
          console.error(err);
          return process.exit(50);
        }
        process.exit(0);
      });
    }
  });
  client.destroy();
}

if (require.main === module) {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || '';
  const CANVAS_TOKEN = process.env.CANVAS_TOKEN || '';
  const SAM_TOKEN = process.env.SAM_TOKEN || '';
  const CONFIG = require('../.config.json');

  hasShutdown = false;
  startBot(DISCORD_TOKEN, CANVAS_TOKEN, SAM_TOKEN, CONFIG).then(null, function() {
    console.error.apply(this, arguments);
    process.exit(1);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
