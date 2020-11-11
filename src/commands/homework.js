// 'use strict';

const fs = require('fs');

const { sendNode } = require('../homeworkutils.js');

const homework = JSON.parse(fs.readFileSync('homework.json'));

const call = async function(msg, args) {
  try {
    // traverse homework tree to find requested node
    curr = homework
    path = 'questions/' + args.join('.')

    for (let i = 0; i < args.length; i++) {
      curr = curr.children[args[i].toLowerCase()]
    }

    console.log(`${msg.author.tag} requested ${path}`)
    await sendNode(msg.channel, curr, path)
  } catch (err) {
    console.warn(err)
    switch (err.name) {
      case 'TypeError':
        await msg.channel.send(`${path} is not a question I know about`)
        break
      default:
        await msg.channel.send('Unknown error detected, aborting operation.')
    }
  }
}

exports.name = ['homework','hw'];
exports.call = call;
exports.help = 'Output homework questions to discord';
