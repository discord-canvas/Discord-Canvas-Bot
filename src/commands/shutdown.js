'use strict';

const { isBotOwner } = require('../commandChecks.js');
const { ipcSend } = require('../utils.js');

const call = async function(message) {
  await message.channel.send({ embed: { title: 'Shutting down', color: 0xff0000 }});
  await ipcSend({ t: 'shutdown' });
}

exports.name = 'shutdown';
exports.call = call;
exports.check = isBotOwner;
exports.help = 'Shutdown the bot';
