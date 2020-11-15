'use strict';

const { performance } = require('perf_hooks');

const { getWeekTimes, assignmentsSame } = require('./utils.js');
const { getWeek, saveWeek, deleteAssignments } = require('./dbinterface.js');

exports.assignmentAutoUpdate = async function(client) {
  console.log('Starting auto updates...');
  const start = performance.now();
  await updateWeekSafe(client);
  await updateWeekSafe(client, 1);
  const end = performance.now();
  console.log(`Finished auto updates in ${end-start}ms`);
}

let updateActive = false;

async function updateWeek(client, offset) {
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
      let toRemove = [];
      for (let assignmentOld of week.assignments) {
        const id = assignmentOld.id;
        let found = false;
        for (let assignmentNew of assignments) {
          if (assignmentNew.id === id) {
            found = true;
            break;
          }
        }
        if (!found) {
          toRemove.push(id);
        }
      }

      if (toRemove.length > 0) {
        console.log('Assignments were deleted', toRemove);
        await deleteAssignments(client.db, toRemove);
      }

      week.assignments = assignments;
      save = true;
      update = true;
    }
  }

  let sentChannels = {};
  for (let message of week.messages) {
    sentChannels[message.channelID] = message;
  }

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
}

async function sendWeekUpdate(client, update, weekTimes, autoConf, embed, sentChannels, week, now) {
  let save = false;
  const sendTime = weekTimes.start + autoConf.offset;
  if (sendTime > now) return save;
  if (update) {
    if (autoConf.channel in sentChannels) {
      // console.log('Update edit message');
      const message = sentChannels[autoConf.channel];
      const m = await client.channels.forge(message.channelID).messages.fetch(message.messageID);
      await m.edit({embed});
    } else {
      // console.log('Update new message')
      const message = await client.channels.forge(autoConf.channel).send({embed});
      week.messages.push({ messageID: message.id, channelID: autoConf.channel, week });
      save = true;
    }
  } else {
    if (autoConf.channel in sentChannels) return save;
    // console.log('Non update new message');
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
