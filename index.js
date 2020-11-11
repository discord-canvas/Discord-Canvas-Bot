// ----------- Set-up -----------
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
require('dotenv').config()

const homework = JSON.parse(fs.readFileSync('homework.json'))
client.login(process.env.BOT_TOKEN);

// ----------- Event Bindings -----------


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // prep
  prefix = '!'
  if (!msg.content.startsWith(prefix) || msg.author.bot) {return}

  const args = msg.content.slice(prefix.length).trim().split(' ')
  const command = args.shift().toLowerCase()

  // check command
  if (command === 'homework' || command === 'hw') {
    try {
      // traverse homework tree to find requested node
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

// ----------- Helpers -----------


function sendNode(destination, node, path) {
  // sends all relevent information about a homework node
  if (node.image) {
    image = fs.readFileSync(path + '.png')
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

  if (message) {destination.send(message)}
}


// TODO:
// Add !help command
