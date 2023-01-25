'use strict';

const { MessageEmbed, MessageAttachment } = require('discord.js-light');
const fs = require('fs').promises;
const {join} = require('path');

const { EMBED_COLOR } = require('../constants.js')

const call = async function(message) {
  const embed = new MessageEmbed({ color: EMBED_COLOR, image: { url: 'attachment://ittefnoc.gif' } });
  const imageBuffer = await fs.readFile(join(__dirname,'../../assets/ittefnoc.gif'));
  const files = [new MessageAttachment(imageBuffer, 'ittefnoc.gif')];
  await message.channel.send({embeds: [embed], files});
}

exports.name = 'ittefnoc';
exports.call = call;
exports.help = '🎉';
