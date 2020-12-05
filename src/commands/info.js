'use strict';

const { humanDuration } = require('@douile/bot-utilities');

const { EMBED_COLOR } = require('../constants.js');

async function call(msg) {
  const memoryUsage = process.memoryUsage();
  await msg.channel.send({embed: {
    title: `${msg.client.user.username} info`,
    color: EMBED_COLOR,
    fields: [
      {
        name: 'INFO', inline: true,
        value: `**Uptime** ${humanDuration(msg.client.uptime, 1000)}\n\
**Ping** ${Math.round(msg.client.ws.ping,2)}ms\n\
**Memory** ${Math.round(memoryUsage.heapUsed/1024/1024,3)}mb/${Math.round(memoryUsage.heapTotal/1024/1024,3)}mb`
      },
      {
        name: 'META', inline: true,
        value: `[Github](https://github.com/discord-canvas/Discord-Canvas-Bot)\n\
[Report an issue](https://github.com/discord-canvas/Discord-Canvas-Bot)\n\
Created by <@!426056810672291840> and <@!293482190031945739>`
      }
    ],
  }});
}

exports.name = 'info';
exports.call = call;
exports.help = 'View bot info';
