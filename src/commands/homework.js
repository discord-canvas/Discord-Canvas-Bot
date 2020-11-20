'use strict';

const fs = require('fs')

const { sendNode, sendImage } = require('../homeworkutils.js')

const homework = JSON.parse(fs.readFileSync('homework.json'))

async function call(msg, args) {
  try {
    if (args.length == 0) {
      await sendNode(msg.channel, homework)
    } else {
      args = args.map((arg) => arg.toLowerCase())
      await travelTree(homework, args, msg.client.config["question_directory"], msg.channel)
    }
  } catch (err) {
    switch (err.name) {
      case 'TypeError':
        await msg.channel.send(`${args.join(" ")} is not a question I know about`)
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
      await sendNode(destination, curr.children[branch], `${path}${branch}`)
    }

  // check for wildcard operator
  } else if (args[0] == '*') {  // potential for misuse
    if (curr.image) {
      await sendImage(destination, path.slice(0, path.length-1))
    }
    for (let [name, child] of Object.entries(curr.children).sort((a,b) =>  ''+a[0].localeCompare(b[0]))) {
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
  await travelTree(curr.children[args[0]], args.slice(1),`${path}${args[0]}.`, destination)
}

exports.name = ['homework','hw']
exports.call = call
exports.help = 'Output homework questions to discord.\n`!hw <arg1> <arg2> ...`\n' +
               '`<arg>`: must be the name of a section of the previous argument. For example, `111 5` being 111 exercise 5. ' +
               'If you are unsure what the correct identifier is, you can call with all arguments that you know and get a list of all subsequent section names.\n' +
               '`<arg>` can also take the form `<argA,argB,...>`. Arguments must be separated by a comma but not a space, and will only return the question for that layer. You cannot create several branches, just return single questions.\n' +
               'For example: `!hw 111 5 3,4` would return questions 3 and 4 of exercise 5 while `!hw 111 5 3,1,2 a` would give questions 2 and 3a. Notice the order, only the first argument will be carried further.\n' +
               'You can also use * to end an argument list. It returns the last explicit section and all sub sections, but only if they have an image attached. For example: `!hw 111 5 3 *` returns questions 3a, b, c and d as well as the header information of 3.'
