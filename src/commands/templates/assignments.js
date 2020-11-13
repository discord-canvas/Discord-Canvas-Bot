'use strict';

exports.upcomingAssignments = function(offset) {
  return async function call(message, parts) {
    const embed = await message.client.canvasUtils.generateAssignmentsEmbed(offset);
    await message.channel.send({ embed });
  }
}
