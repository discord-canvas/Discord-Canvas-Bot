'use strict';

const fs = require('fs').promises;

exports.sendImage = async (destination, path) => {
  const image = await fs.readFile(path + '.png')
  destination.send('', {files:[image]})
}

exports.sendNode = async (destination, node, path) => {
  // sends all relevent information about a homework node
  if (node.image) {
    exports.sendImage(destination, path)
  }

  let message = ''  // collates messages into one rather than sending many
  if (node.alt_desc) {
    message += `\n${node.alt_desc}\n`
  }
  if (node.children) {
    message += '\nSubs:\n'
    for (let key of Object.keys(node.children)) {
      message += `\t${key}\n`
    }
  }

  if (message) {await destination.send(message)}
}
