const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
require('dotenv').config()

// image  = fs.readFileSync("questions/105.1.install haskell.png", () => console.log("Image loaded"))

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  prefix = "!"
  if (!msg.content.startsWith(prefix) || msg.author.bot) return

  const args = msg.content.slice(prefix.length).trim().split(' ')
  const command = args.shift().toLowerCase()
  console.log(args, command);
  if (command === 'homework') {
    id = args.join('.')
    console.log(id)
    image = fs.readFileSync("questions/" + id + ".png")
    msg.channel.send('Pong!', {files: [image]});
  }

  // if (msg.content.toLowerCase() === 'ping') {
  //   id = "105.1.install haskell"
  //   image = fs.readFileSync("questions/" + id + ".png")
  //   msg.channel.send('Pong!', {files: [image]});
  // }
});

// saveHomework (homework) {}

client.login(process.env.BOT_TOKEN);

// TODO: Allow message to contain image id
// Add error catching for invalid ids
