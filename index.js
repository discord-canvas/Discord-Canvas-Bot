const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
require('dotenv').config()

const homework = JSON.parse(fs.readFileSync('homework.json'))
console.log(homework['105'])

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  prefix = '!'
  if (!msg.content.startsWith(prefix) || msg.author.bot) {return}

  const args = msg.content.slice(prefix.length).trim().split(' ')
  const command = args.shift().toLowerCase()

  if (command === 'homework') {
    qNode = homework['105'].children['1'].children['pure-functions'].children['1']
    image = fs.readFileSync(qNode.image)
    msg.channel.send('', {files:[image]})
  }
})


function sendNode(destination, node) {
  if (node.image) {
    image = fs.readFileSync(node.image)
    destination.send(node.children, {files:image})
  }
}

client.login(process.env.BOT_TOKEN);

// TODO: Allow message to contain image id
// Add error catching for invalid ids
