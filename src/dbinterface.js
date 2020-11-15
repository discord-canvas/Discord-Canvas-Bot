'use strict';

const { Week, enforceType } = require('./types.js');

/**
* get from database
* @async
* @param {Database} database
* @param {String} sql
* @param {Array} params
* @returns {Array?}
*/
function asyncGet(database, sql, ...params) {
  return new Promise((resolve, reject) => {
    database.get(sql, ...params, function(err, row) {
      if (err !== null) return reject(err);
      resolve(row);
    });
  });
}

/**
* get all rows from database
* @async
* @param {Database} database
* @param {String} sql
* @param {Array} params
* @returns {Array[]?}
*/
function asyncAll(database, sql, ...params) {
  return new Promise((resolve, reject) => {
    database.all(sql, ...params, function(err, rows) {
      if (err !== null) return reject(err);
      resolve(rows);
    });
  });
}

/**
* run a statement
* @async
* @param {Database} database
* @param {String} sql
* @param {Array} params
*/
function asyncRun(database, sql, ...params) {
  return new Promise((resolve, reject) => {
    database.run(sql, ...params, function(err) {
      if (err !== null) return reject(err);
      resolve();
    });
  });
}

/**
* serialize statements
* @async
* @param {Database} database
* @param {AsyncFunction} f
*/
function asyncSerialize(database, f) {
  return new Promise((resolve,reject) => {
    database.serialize(function() {
      f.apply(this, arguments).then(resolve, reject);
    })
  });
}

/**
* Get a week from the database
* @param {Database} database
* @param {Number} startTime - start time of the week
* @returns Week
*/
exports.getWeek = async function(db, startTime) {
  const row = await asyncGet(db, 'SELECT time_start, time_end FROM weeks WHERE time_start=?', startTime);
  if (row === undefined) return null;
  const week = { start: row.time_start, end: row.time_end, assignments: [], messages: [] };

  const assignmentRows = await asyncAll(db, 'SELECT id, time_due, course_id, name, url, points FROM assignments WHERE week_id=?', startTime);
  for (let assignment of assignmentRows) {
    const courseRow = await asyncGet(db, 'SELECT name FROM courses WHERE id=?', assignment.course_id);
    if (courseRow === undefined) continue;
    week.assignments.push({
      id: assignment.id,
      week,
      due: assignment.time_due,
      course: {
        id: assignment.course_id,
        name: courseRow.name
      },
      name: assignment.name,
      url: assignment.url,
      points: assignment.points
    });
  }

  const messageRows = await asyncAll(db, 'SELECT message_id, channel_id FROM messages WHERE week_id=?', startTime);
  for (let message of messageRows) {
    week.messages.push({ messageID: message.message_id, channelID: message.channel_id, week });
  }

  return enforceType(Week, week);
}

/**
* @async
* @param {Database} database
* @param {Week} week
*/
exports.saveWeek = async function(db, week) {
  await asyncSerialize(db, async function() {
    await asyncRun(db, 'INSERT INTO weeks (time_start, time_end) VALUES (?, ?) ON CONFLICT(time_start) DO UPDATE set time_end=?',
      week.start, week.end, week.end
    );

    let courses = {};
    for (let assignment of week.assignments) {
      await asyncRun(db, 'INSERT INTO assignments (id, week_id, time_due, course_id, name, url, points) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE set week_id=?, time_due=?, course_id=?, name=?, url=?, points=?',
        assignment.id, assignment.week.start, assignment.due, assignment.course.id, assignment.name, assignment.url, assignment.points,
        assignment.week.start, assignment.due, assignment.course.id, assignment.name, assignment.url, assignment.points
      );
      courses[assignment.course.id] = assignment.course;
    }
    for (let course of Object.values(courses)) {
      await asyncRun(db, 'INSERT INTO courses (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE set name=?',
        course.id, course.name, course.name
      );
    }

    for (let message of week.messages) {
      await asyncRun(db, 'INSERT INTO messages (message_id, channel_id, week_id) VALUES (?, ?, ?) ON CONFLICT(message_id) DO UPDATE SET channel_id=?, week_id=?',
        message.messageID, message.channelID, message.week.start,
        message.channelID, message.week.start
      );
    }
  });
}

exports.deleteAssignments = async function(db, assignments) {
  // TODO: Change this to something better
  let values = '?,'.repeat(assignments.length);
  if (values.length > 0) values = values.substring(0, values.length-1);
  await asyncRun(db, `DELETE FROM assignments WHERE id IN (${values})`, ...assignments);
}
