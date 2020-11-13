'use strict';

const { MessageEmbed } = require('discord.js-light');

const { isOfBaseType } = require('@douile/bot-utilities');

const { EMBED_COLOR } = require('../constants.js');

const matchAny = function(text, search) {
  for (let s of search) {
    if (text.match(s) !== null) return true;
  }
  return false;
}

const call = async function(message, parts) {
  const search = parts.map(s => new RegExp(s, 'gi'));
  if (search.length === 0) {
    await message.channel.send(new MessageEmbed({
      title: 'Help',
      color: EMBED_COLOR,
      fields: Array.from(message.client.commands.entries())
        .filter(cmd =>
          (isOfBaseType(cmd[1].check, Function) ? cmd[1].check(message) : true) &&
          cmd[0] === cmd[1].name[0]
        )
        .map(cmd => {
          return {
            name: `${message.client.config.prefix}${cmd[0]}`,
            value: isOfBaseType(cmd[1].help, String) ? cmd[1].help : 'No help message provided',
            inline: false
          };
        })
    }));
  } else {
    await message.channel.send(new MessageEmbed({
      title: 'Help',
      color: EMBED_COLOR,
      fields: Array.from(message.client.commands.entries())
        .filter(cmd =>
          cmd[1].name.some(c => matchAny(`${message.client.config.prefix}${c}`, search)) &&
          (isOfBaseType(cmd[1].check, Function) ? cmd[1].check(message) : true) &&
          cmd[0] === cmd[1].name[0]
        )
        .map(cmd => {
          return {
            name: `${message.client.config.prefix}${cmd[0]}`,
            value: isOfBaseType(cmd[1].help, String) ? cmd[1].help : 'No help message provided',
            inline: false
          };
        })
    }));
  }
}

exports.name = 'help';
exports.call = call;
exports.help = 'Get some help';
