'use strict';

const { getWeekTimes } = require('./utils.js');
const { getWeek, saveWeek } = require('./dbinterface.js');

exports.assignmentAutoUpdate = async function(client) {
  await updateWeek(client);
  await updateWeek(client, 1);
}

let updateActive = false;

async function updateWeek(client, offset) {
  const weekTimes = getWeekTimes(offset);

  let week = await getWeek(client.db, weekTimes.start);
  let save = false;

  if (week === null) {
    week = await client.canvasUtils.getWeeksAssignments(offset);
    week.messages = [];
    save = true;
  }

  let sentChannels = {};
  for (let message of week.messages) {
    sendChannels[message.channelID] = message;
  }
  const now = Date.now();

  const embed = await client.canvasUtils.generateAssignmentsEmbed(week);

  for (let autoConf of client.config.automated_assignments) {
    const sendTime = weekTimes.start + autoConf.offset;
    if (sendTime > now) continue;
    if (autoConf.channel in sentChannels) continue;
    const message = await client.channels.forge(autoConf.channel).send(embed);
    week.messages.push({ messageID: message.id, channelID: message.channel.id, week });
    save = true;
  }

  if (save) {
    await saveWeek(client.db, week);
  }
}

async function updateWeekSafe() {
  if (updateActive) return;
  updateActive = true;
  try {
    await updateWeek.apply(this, arguments);
  } catch(e) {
    updateActive = false;
    throw e;
  } finally {
    updateActive = false;
  }
}
