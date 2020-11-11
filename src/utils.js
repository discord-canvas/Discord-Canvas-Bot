const MS_DAY = 1000 * 60 * 60 * 24;
const MS_WEEK = MS_DAY*7;

exports.getWeekTimes = function(offset) {
  let start = new Date();
  start.setUTCMilliseconds(0);
  start.setUTCSeconds(0);
  start.setUTCMinutes(0);
  start.setUTCHours(0);
  start = start.getTime() - ((start.getDay()-1) * MS_DAY);
  if (!isNaN(offset)) start += MS_WEEK*offset;
  end = start + (MS_WEEK);
  return { start, end };
}

exports.asyncWrap = function(asyncFunction) {
  return function() {
    asyncFunction.apply(this, arguments).then(null, console.error);
  }
}
