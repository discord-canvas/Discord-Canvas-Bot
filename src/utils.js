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
