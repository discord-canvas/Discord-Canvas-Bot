'use strict';

/**
* Week object
* @typedef {Object} Week
* @param {Number} id
* @param {String} messageID
* @param {Number} start
* @param {Number} end
* @param {Array.<Assignment>} assignments
*/

/**
* Assignment object
* @typedef {Object} Assignment
* @param {Number} id
* @param {Week} week
* @param {Number} due
* @param {Course} course
* @param {String} name
* @param {Number} points
*/

/**
* Course object
* @typedef {Object} Course
* @param {Number} id
* @param {String} name
*/

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
* prepare a statement
* @async
* @param {Database} database
* @param {String} sql
* @param {Array} params
* @returns {Statement}
*/
function asyncPrepare(database, sql, ...params) {
  return new Promise((resolve, reject) => {
    const statement = database.prepare(sql, ...params, function(err) {
      if (err !== null) return reject(err);
      resolve(statement);
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
  })
}

/**
* Get a week from the database
* @param {Object} database
* @param {Number} startTime - start time of the week
* @returns Week
*/
exports.getWeek = async function(db, startTime) {
  const row = await asyncGet(db, 'SELECT id, message_id, start_date, end_date FROM weekly_updates WHERE start_date=?', startTime);
  if (row === undefined) return null;
  const [ id, messageID, start, end ] = row;
  const assignmentRows = await asyncAll(db, 'SELECT id, time_due, course_id, name, points FROM assignments WHERE week_id=?', id);
  const week = { id, messageID, start, end, assignments: [] };
  for (let assignment of assignmentRows) {
    const [ id, due, courseID, name, points] = assignment;
    const courseRow = await asyncGet(db, 'SELECT canvas_id, name WHERE id=?', courseID);
    if (courseRow === undefined) continue;
    week.assignments.push({
      id, week, due, course: { id: courseID, canvasID: courseRow[0], name: courseRow[1] },
      name, points
    });
  }
  return week;
}

/**
* @async
* @param {Object} database
* @param {Week} week
*/
exports.saveWeek = function(db, week) {
  await asyncSerialize(db, async function() {
    await asyncRun('INSERT INTO weekly_updates (id, message_id, start_date, end_date) VALUES (?, ?, ?, ?) ON CONFLICT(start_date) DO UPDATE set id=?, message_id=?, end_date=?',
      week.id, week.messageID, week.start, week.end, week.id, week.messageID, week.end
    );
    let courses = {};
    for (let assignment of week.assignments) {
      await asyncRun('INSERT INTO assignments (id, week_id, time_due, course_id, name, points) VALUES (?, ?, ?, ?, ?, ?) ON CONFICT(id) DO UPDATE set week_id=?, time_due=?, course_id=?, name=?, points=?',
        assignment.id, assignment.week.id, assignment.due, assignment.course.id, assignment.name, assignment.points,
        assignment.week.id, assignment.due, assignment.course.id, assignment.name, assignment.points
      );
      courses[assignment.course.id] = assignment.course;
    }
    for (let course of Object.values(courses)) {
      await asyncRun('INSERT INTO courses (id, name) VALUES (?, ?) ON CONFICT(id) DO UPDATE set name=?',
        course.id, course.name, course.name
      );
    }

  });
}
