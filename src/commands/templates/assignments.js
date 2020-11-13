'use strict';

exports.upcomingAssignments = function(offset) {
  return async function call(message, parts) {
    let filter;
    if (parts.length > 0) filter = parts[0];
    const embed = await message.client.canvasUtils.generateAssignmentsEmbed(offset, filter);
    await message.channel.send({ embed });
  }
}
