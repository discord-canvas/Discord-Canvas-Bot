'use strict';

const { getWeekTimes, assignmentsSame } = require('./utils.js');
const { getWeek, saveWeek } = require('./dbinterface.js');

exports.assignmentAutoUpdate = async function(client) {
  await updateWeek(client);
  await updateWeek(client, 1);
}

let updateActive = false;

async function updateWeek(client, offset) {
  console.log('Starting auto update...');
  const weekTimes = getWeekTimes(offset);

  let week = await getWeek(client.db, weekTimes.start);
  let save = false, update = false;

  if (week === null) {
    week = await client.canvasUtils.getWeeksAssignments(offset);
    week.messages = [];
    save = true;
  } else {
    const { assignments } = await client.canvasUtils.getWeeksAssignments(offset);
    if (!assignmentsSame(week.assignments, assignments)) {
      week.assignments = assignments;
      save = true;
      update = true;
    }
  }

  let sentChannels = {};
  for (let message of week.messages) {
    sentChannels[message.channelID] = message;
  }
  console.log(sentChannels);

  const now = Date.now();

  const embed = await client.canvasUtils.generateAssignmentsEmbed(week);

  const sendPromises = client.config.automated_assignments.map((autoConf) => sendWeekUpdate(client, update, weekTimes, autoConf, embed, sentChannels, week, now));
  const sendResult = await Promise.all(sendPromises);

  if (!save) {
    save = sendResult.some(v => v);
  }

  if (save) {
    await saveWeek(client.db, week);
  }
  console.log('Finished auto update');
}

async function sendWeekUpdate(client, update, weekTimes, autoConf, embed, sentChannels, week, now) {
  let save = false;
  const sendTime = weekTimes.start + autoConf.offset;
  if (sendTime > now) return save;
  if (update) {
    if (autoConf.channel in sentChannels) {
      console.log('Update edit message');
      const message = sentChannels[autoConf.channel];
      const m = await client.channels.forge(message.channelID).messages.fetch(message.messageID);
      await m.edit({embed});
    } else {
      console.log('Update new message')
      const message = await client.channels.forge(autoConf.channel).send({embed});
      week.messages.push({ messageID: message.id, channelID: autoConf.channel, week });
      save = true;
    }
  } else {
    if (autoConf.channel in sentChannels) return save;
    console.log('Non update new message');
    const message = await client.channels.forge(autoConf.channel).send({embed});
    week.messages.push({ messageID: message.id, channelID: message.channel.id, week });
    save = true;
  }
  return save;
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
