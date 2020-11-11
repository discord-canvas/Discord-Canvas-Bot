'use strict';

const { performance } = require('perf_hooks');

const { getWeekTimes } = require('./utils.js');

//TODO: Make this a class
let client;
exports.setCanvasUtilsClient = function(c) {
  client = c; // Do not look this is ugly temporary code
}

const UPDATE_TIME = 15 * 60 * 1000;
let LAST_UPDATE;
let CACHE;

const getCoursesAndAssignments = exports.getCoursesAndAssignments = async function() {
  const courses = await client.canvas.getFilteredCourses();
  let promises = [];
  for (let courseID in courses) {
    promises.push(client.canvas.getCourseAssignments(courseID));
    promises.push(client.canvas.getCourseDiscussions(courseID));
  }
  const assignments = (await Promise.all(promises)).flat();
  return { courses, assignments };
}

const getCoursesAndAssignmentsCached = exports.getCoursesAndAssignmentsCached = async function() {
  const now = performance.now();
  if (isNaN(LAST_UPDATE) || CACHE === undefined || now - LAST_UPDATE >= UPDATE_TIME) {
    CACHE = await getCoursesAndAssignments();
    LAST_UPDATE = now;
  }
  return CACHE;
}

const getWeeksAssignments = exports.getWeeksAssignments = async function(offset) {
  const weekTimes = getWeekTimes(offset);
  let { courses, assignments } = await getCoursesAndAssignmentsCached();
  return { courses, assignments: assignments.concat(parseAssignmentOverrides(weekTimes.start, courses)).filter(a => a.due >= weekTimes.start && a.due <= weekTimes.end ).sort((a,b) => a.due - b.due), weekTimes };
}

const parseAssignmentOverrides = exports.parseAssignmentOverrides = function(startTime, courses) {
  return client.config.overrides.map(o => {
    courses[o.course] = o.course;
    const due = startTime + o.offset;
    let dueDate = new Date();
    dueDate.setTime(due);
    return {
      id: `override-${o.name}`,
      name: o.name,
      course: o.course,
      desc: '',
      due, dueDate,
      points: o.points,
      url: ''
    };
  });
}

const generateAssignmentsEmbed = exports.generateAssignmentsEmbed = async function(offset) {
  const { courses, assignments, weekTimes } = await getWeeksAssignments(offset);
  const startDate = new Date();
  startDate.setTime(weekTimes.start);
  return {
    title: 'Upcoming assignments',
    color: 0xff0000,
    footer: { text: 'Week starting' },
    timestamp: startDate.toISOString(),
    fields: assignments.map(a => {
      return {
        name: courses[a.course],
        value: `[${a.name}](${a.url})\nDue: ${a.dueDate.toUTCString()}\nPoints: ${a.points}`,
        inline: false
      }
    })
  };
}
