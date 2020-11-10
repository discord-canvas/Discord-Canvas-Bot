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

  if (command === 'homework') {
    curr = homework
    for (let i = 0; i < args.length; i++) {
      curr = curr.children[args[i].toLowerCase()]
    }

    sendNode(msg.channel, curr)
  }
})


function sendNode(destination, node) {
  if (node.image) {
    image = fs.readFileSync(node.image)
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

// TODO: Allow message to contain image id
// Add error catching for invalid ids
