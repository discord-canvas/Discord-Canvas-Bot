'use strict';

const MS_DAY = 1000 * 60 * 60 * 24;
const MS_WEEK = MS_DAY*7;

/**
* Week times
* @typedef {Object} WeekTimes
* @param {Number} start - Unix time for start of the week
* @param {Number} end - Unix time for end of the week
*/

/**
* Get the unix time for start and end of week
* @param {Number} [offset] - The offset from current week (e.g. -1 last week, 1 next week)
* @returns {WeekTimes} The unix time for start and end of specified week
*/
exports.getWeekTimes = function(offset) {
  let start = new Date();
  start.setUTCMilliseconds(0);
  start.setUTCSeconds(0);
  start.setUTCMinutes(0);
  start.setUTCHours(0);
  start = start.getTime() - ((start.getDay()-1) * MS_DAY);
  if (!isNaN(offset)) start += MS_WEEK*offset;
  let end = start + (MS_WEEK);
  return { start, end };
}

/**
* Wrap an async function, and do something if it errors
* @param {Function} asyncFunction - The asyncronous function to wrap
* @param {Function} [onError=console.error] - The function to run in event of error
* @returns {Function}
*/
exports.asyncWrap = function(asyncFunction, onError) {
  const error = onError ? onError : console.error;
  return function() {
    asyncFunction.apply(this, arguments).then(null, error);
  }
}

/**
* Check if a value is a promise, if it is await it
* @param {*} res - value to check
* @retuns {*}
*/
exports.unwrapSync = async function(res) {
  if (res instanceof Promise) {
    res = await res;
  }
  return res;
}

/**
* Send a message via ipc
* @async
* @param {Object} message - Data to send
*/
exports.ipcSend = function(message) {
  if (process.send === undefined) return Promise.resolve();
  return new Promise((resolve,reject) => {
    process.send(message, function(err) {
      if (err !== null) return reject(err);
      resolve();
    });
  })
}

const ASSIGNMENT_KEYS = Object.freeze([
  ['id'],
  ['due'],
  ['course','id'],
  ['course','name'],
  ['name'],
  ['url'],
  ['points'],
]);

/**
* Check if two assignments are the same
* @param {Assignment} a
* @param {Assignment} b
* @returns {Boolean}
*/
const assignmentSame = exports.assignmentSame = function(a, b) {
  for (let keys of ASSIGNMENT_KEYS) {
    let valueA, valueB;
    for (let key of keys) {
      valueA = valueA === undefined ? a[key] : valueA[key];
      valueB = valueB === undefined ? b[key] : valueB[key];
    }
    if (valueA !== valueB) return false;
  }
  return true;
}

/**
* Check if two lists of assignments are the same
* VERY SLOW
* @param {Array.<Assignment>} a
* @param {Array.<Assignment>} b
* @return {Boolean}
*/
exports.assignmentsSame = function(a, b) {
  if (a.length !== b.length) return false;
  for (let assA of a) {
    // TODO: Maybe pop used assignments from b here
    let notFound = true;
    for (let assB of b) {
      if (assignmentSame(assA, assB)) notFound = false;
    }
    if (notFound) return false;
  }
  return true;
}
