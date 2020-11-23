'use strict';

const fs = require('fs')

const {sendImage} = require('../homeworkutils.js')

const homework = JSON.parse(fs.readFileSync('homework.json'))

async function call(msg, args) {
  try {
    args = args.map((arg) => arg.toLowerCase())
    await travelTree(homework, args, msg.client.config["answer_directory"], msg.channel)
  } catch (err) {
    switch (err.name) {
      case 'TypeError':
        await msg.channel.send(`${args.join(" ")} is not an answer I know about`)
        break
      default:
        console.warn(err)
        await msg.channel.send('Unknown error detected, aborting operation.')
    }
  }
}

async function travelTree(curr, args, path, destination) {
  // check for and handle branching arg
  if (args[0].includes(',')) {
    const branches = args.shift().split(',')
    args.unshift(branches.shift())

    for (let branch of branches) {
      if (curr.children[branch].solution) {
        await sendImage(destination, `${path}${branch}`)
      }
    }

  // check for wildcard operator
  } else if (args[0] == '*') {  // potential for misuse
    if (curr.solution) {
      await sendImage(destination, path.slice(0, path.length-1))
    }
    for (let [name, child] of Object.entries(curr.children).sort((a,b) =>  ''+a[0].localeCompare(b[0]))) {
      if (child.solution) {
        await sendImage(destination, `${path}${name}`)
      }
    }
    return
  }

  // base case
  if (args.length == 1) {
    if (! curr.children[args[0]].solution) {
      throw TypeError
    }
    await sendImage(destination, `${path}${args[0]}`)
    return
  }
  await travelTree(curr.children[args[0]], args.slice(1),`${path}${args[0]}.`, destination)
}

exports.name = ['answer']
exports.call = call
exports.help = 'Outputs a screenshot of the answer for the given question. Only works for questions without children, as those are the only things with answers'
