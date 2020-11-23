'use strict';

const { MessageEmbed, MessageAttachment } = require('discord.js-light');
const fs = require('fs').promises;
const {join} = require('path');

const { EMBED_COLOR } = require('../constants.js')

const call = async function(message) {
  const embed = new MessageEmbed({ color: EMBED_COLOR, image: { url: 'attachment://confetti.gif' } });
  const imageBuffer = await fs.readFile(join(__dirname,'../../assets/confetti.gif'));
  embed.attachFiles(new MessageAttachment(imageBuffer, 'confetti.gif'));
  await message.channel.send({embed});
}

exports.name = 'confetti';
exports.call = call;
exports.help = '🎉';
