'use strict';

const { Team } = require('discord.js-light');

exports.isBotOwner = async function(message) {
  const application = await message.client.fetchApplication();
  if (application.owner instanceof Team) {
    return application.owner.members.has(message.author.id);
  }
  return application.owner.id === message.author.id;
}
