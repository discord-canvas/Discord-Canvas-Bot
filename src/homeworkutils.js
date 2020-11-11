// 'use strict';

const fs = require('fs').promises;

exports.sendNode = async function(destination, node, path) {
  // sends all relevent information about a homework node
  if (node.image) {
    image = await fs.readFile(path + '.png')
    destination.send("", {files:[image]})
  }

  message = ''  // collates messages into one rather than sending many
  if (node.alt_desc) {
    message += `\n${node.alt_desc}\n`
  }
  if (node.children) {
    message += '\nSubs:\n'
    for ([key, value] of Object.entries(node.children)) {
      message += `\t${key}\n`
    }
  }

  if (message) {await destination.send(message)}
}
