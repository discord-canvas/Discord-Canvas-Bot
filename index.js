'use strict';

require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || '';
const CANVAS_TOKEN = process.env.CANVAS_TOKEN || '';
const CONFIG = require('./.config.json');

const startBot = require('./src/index.js');
startBot(DISCORD_TOKEN, CANVAS_TOKEN, CONFIG).then(null, function() {
  console.error.apply(this, arguments);
  process.exit(1);
});
