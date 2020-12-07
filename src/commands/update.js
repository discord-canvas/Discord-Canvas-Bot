'use strict';

const { isBotOwner } = require('../commandChecks.js');
const { ipcSend } = require('../utils.js');

const call = async function(message) {
  const response = await message.channel.send({ embed: { title: 'Updating...', color: 0x0000ff }});
  await ipcSend({ t: 'update', msg: response.id, chan: response.channel.id });
}

exports.name = 'update';
exports.call = call;
exports.check = isBotOwner;
exports.help = 'Update the bot';
