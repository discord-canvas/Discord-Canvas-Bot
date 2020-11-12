'use strict';

async function call(message) {
  const embed = await message.client.canvasUtils.generateAssignmentsEmbed();
  await message.channel.send({ embed });
}

exports.name = 'thisweek';
exports.call = call;
exports.help = 'Output assignments due this week';
