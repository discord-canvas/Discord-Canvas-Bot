'use strict';

const { isBotOwner } = require('../commandChecks.js');

const call = async function(message) {
  message.channel.send('test');
}

exports.name = 'update';
exports.call = call;
exports.check = isBotOwner;
exports.help = 'Update the bot';
