'use strict';

const { isBotOwner } = require('../commandChecks.js');
const { ipcSend } = require('../utils.js');

const call = async function(message) {
  const response = await message.channel.send({ embed: { title: 'Restarting', color: 0xff0000 }});
  await ipcSend({ t: 'restart', msg: response.id, chan: response.channel.id });
}

exports.name = 'restart';
exports.call = call;
exports.check = isBotOwner;
exports.help = 'Restart the bot';
