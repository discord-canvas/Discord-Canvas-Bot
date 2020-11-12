// 'use strict';

const fs = require('fs');

const { sendNode, sendImage } = require('../homeworkutils.js');

const homework = JSON.parse(fs.readFileSync('homework.json'));

// const call = async function(msg, args) {
//   try {
//     // traverse homework tree to find requested node
//     curr = homework
//
//     for (var i = 0; i < args.length-1; i++) {
//       curr = curr.children[args[i].toLowerCase()]
//     }
//
//     console.log(`${msg.author.tag} requested ${path}`)
//     if (args[i].includes(",")) {  // if path is end-branching
//       branch = args.pop()
//       branch = branch.split(',')
//       path = 'questions/' + args.join('.')
//
//       await sendNode(msg.channel, curr, path + branch[0])
//
//     } else {
//       path = 'questions/' + args.join('.')
//       await sendNode(msg.channel, curr, path)
//     }
//   } catch (err) {
//     console.warn(err)
//     switch (err.name) {
//       case 'TypeError':
//         await msg.channel.send(`${path} is not a question I know about`)
//         break
//       default:
//         await msg.channel.send('Unknown error detected, aborting operation.')
//     }
//   }
// }

const call = async function (msg, args) {
  try {
    travelTree(homework, args, 'questions/', msg.channel)
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

async function travelTree(curr, args, path, destination) {
  // check for and handle branching arg
  if (args[0].includes(',')) {
    [args[0], ...branches] = args.shift().split(',')
    for (branch of branches) {
      await sendNode(destination, curr.children[branch], `${path}${branch}`)
    }
  // check for wildcard operator
  } else if (args[0] == '*') {  // potential for misuse
    if (curr.image) {
      await sendImage(destination, path.slice(0, path.length-1))
    }
    for ([name, child] of Object.entries(curr.children).sort((a,b) =>  ''+a[0].localeCompare(b[0]))) {
      if (child.image) {
        await sendImage(destination, `${path}${name}`)
      }
    }
    return
  }

  // base case
  if (args.length == 1) {
    await sendNode(destination, curr.children[args[0]], `${path}${args[0]}`)
    return
  }

  travelTree(curr.children[args[0]], args.slice(1),`${path}${args[0]}.`, destination)
}

exports.name = ['homework','hw'];
exports.call = call;
exports.help = 'Output homework questions to discord';
