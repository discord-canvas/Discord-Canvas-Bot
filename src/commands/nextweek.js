'use strict';

const { generateAssignmentsEmbed } = require('../canvasutils.js');

async function call(message) {
  const embed = await generateAssignmentsEmbed(1);
  await message.channel.send({ embed });
}

exports.name = 'nextweek';
exports.call = call;
exports.help = 'Output assignments due next week';
