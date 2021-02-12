'use strict';

const fs = require('fs').promises;

exports.sendImage = async (destination, path) => {
  const image = await fs.readFile(path + '.png');
  await destination.send({ embed: {image:{url:'attachment://image.png'}}, files: [{ attachment: image, name: 'image.png' }] });
}

exports.sendNode = async (destination, node, path) => {
  // sends all relevent information about a homework node
  const embed = {};
  let files;

  if (node.image) {
    const image = await fs.readFile(path + '.png');
    embed.image = { url: 'attachment://image.png' };
    files = [{ attachment: image, name: 'image.png' }];
  }

  if (node.alt_desc) {
    embed.description = node.alt_desc;
  }

  if (node.children) {
    embed.fields = [{name: 'Subs', inline: false, value: Object.keys(node.children).map(key => `\t${key}`).join('\n') }];
  }

  await destination.send({ embed, files });
}
