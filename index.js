const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
require('dotenv').config()

const homework = JSON.parse(fs.readFileSync('homework.json'))

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  prefix = '!'
  if (!msg.content.startsWith(prefix) || msg.author.bot) {return}

  const args = msg.content.slice(prefix.length).trim().split(' ')
  const command = args.shift().toLowerCase()

  if (command === 'homework' || command === 'hw') {
    try {
      curr = homework
      path = 'questions/' + args.join('.')

      for (let i = 0; i < args.length; i++) {
        curr = curr.children[args[i].toLowerCase()]
      }

      console.log(`${msg.author.tag} requested ${path}`)
      sendNode(msg.channel, curr, path)
    } catch (err) {
      switch (err.name) {
        case 'TypeError':
          msg.channel.send(`${path} is not a question I know about`)
          break
        default:
          msg.channel.send('Unknown error detected, aborting operation.')
      }
    }
  }
})


function sendNode(destination, node, path) {
  if (node.image) {
    image = fs.readFileSync(path + '.png')
    destination.send("", {files:[image]})
  }

  message = ''
  if (node.alt_desc) {
    message += `\n${node.alt_desc}\n`
  }
  if (node.children) {
    message += '\nSubs:\n'
    for ([key, value] of Object.entries(node.children)) {
      message += `\t${key}\n`
    }
  }
  if (message) {destination.send(message)}
}

client.login(process.env.BOT_TOKEN);

// TODO:
// Add error catching for invalid ids
// Add !help command
