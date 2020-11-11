'use strict';

const { generateAssignmentsEmbed } = require('../canvasutils.js');

async function call(message) {
  const embed = await generateAssignmentsEmbed();
  await message.channel.send({ embed });
}

exports.name = 'thisweek';
exports.call = call;
