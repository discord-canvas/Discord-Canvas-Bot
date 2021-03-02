'use strict';

const { performance } = require('perf_hooks');

const { Week, enforceType } = require('./types.js');
const { getWeekTimes } = require('./utils.js');

const UPDATE_TIME = 15 * 60 * 1000;

function parseAssignments(week, assignments, courses) {
  return assignments.map((a) => {
    const newA = { id: undefined, due: undefined, name: undefined, url: undefined, points: undefined };
    for (let key in newA) {
      newA[key] = a[key];
    }
    newA.week = week;
    newA.course = { id: a.course, name: courses[a.course] };
    return newA;
  });
}

class CanvasUtils {
  constructor(canvas, sam, overrides) {
    this.canvas = canvas;
    this.sam = sam;
    this.overrides = overrides;
    this.lastUpdate = undefined;
    this.cache = undefined;
  }

  async getCoursesAndAssignments() {
    const courses = await this.canvas.getFilteredCourses();
    let promises = [];
    for (let courseID in courses) {
      promises.push(this.canvas.getCourseAssignments(courseID));
      // promises.push(this.canvas.getCourseDiscussions(courseID));
    }
    let assignments = (await Promise.all(promises)).flat();
    const samCourses = await this.sam.getFilteredCourses();
    promises = [];
    for (let courseID of samCourses) {
      promises.push(this.sam.getCourseAssignments(courseID));
      courses[courseID] = courseID;
    }
    assignments = assignments.concat((await Promise.all(promises)).flat());
    return { courses, assignments };
  }

  async getCoursesAndAssignmentsCached() {
    const now = performance.now();
    if (isNaN(this.lastUpdate) || this.cache === undefined || now - this.lastUpdate >= UPDATE_TIME) {
      this.cache = await this.getCoursesAndAssignments();
      this.lastUpdate = now;
    }
    return this.cache;
  }

  async getWeeksAssignments(offset) {
    const weekTimes = getWeekTimes(offset);
    let { courses, assignments } = await this.getCoursesAndAssignmentsCached();
    const week = {
      start: weekTimes.start,
      end: weekTimes.end,
    };
    week.assignments = parseAssignments(
      week,
      assignments.concat(this.parseAssignmentOverrides(weekTimes.start, courses)).filter(a => a.due >= weekTimes.start && a.due <= weekTimes.end ).sort((a,b) => a.due - b.due),
      courses
    );
    return enforceType(Week, week);
  }

  parseAssignmentOverrides(startTime, courses) {
    return this.overrides.map(o => {
      courses[o.course] = o.course;
      const due = startTime + o.offset;
      let dueDate = new Date();
      dueDate.setTime(due);
      return {
        id: `override-${o.course}-${o.name}-${due}`,
        name: o.name,
        course: o.course,
        due, dueDate,
        points: o.points,
        url: ''
      };
    });
  }

  async generateAssignmentsEmbed(week, filter) {
    const startDate = new Date();
    startDate.setTime(week.start);

    let fields = week.assignments.map(a => {
      let dueDate = new Date(a.due);
      return {
        name: a.course.name,
        value: `${a.url ? `[${a.name}](${a.url})` : a.name}\nDue: ${dueDate.toUTCString()}\nPoints: ${a.points}`,
        inline: false
      }
    });
    let extraFooter = '';
    if (filter !== undefined) {
      const startSize = fields.length;
      let reFilter = new RegExp(filter, 'gi');
      fields = fields.filter(field => field.name.match(reFilter) !== null);
      extraFooter = `${fields.length}/${startSize} | `;
    }
    return {
      title: 'Upcoming assignments',
      color: 0xff0000,
      footer: { text: `${extraFooter}Week starting` },
      timestamp: startDate.toISOString(),
      fields,
    };
  }
}

module.exports = CanvasUtils;
