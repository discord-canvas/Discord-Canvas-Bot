'use strict';

const { performance } = require('perf_hooks');

const { getWeekTimes } = require('./utils.js');

const UPDATE_TIME = 15 * 60 * 1000;

class CanvasUtils {
  constructor(canvas, overrides) {
    this.canvas = canvas;
    this.overrides = overrides;
    this.lastUpdate = undefined;
    this.cache = undefined;
  }

  async getCoursesAndAssignments() {
    const courses = await this.canvas.getFilteredCourses();
    let promises = [];
    for (let courseID in courses) {
      promises.push(this.canvas.getCourseAssignments(courseID));
      promises.push(this.canvas.getCourseDiscussions(courseID));
    }
    const assignments = (await Promise.all(promises)).flat();
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
    return {
      courses,
      assignments: assignments.concat(this.parseAssignmentOverrides(weekTimes.start, courses)).filter(a => a.due >= weekTimes.start && a.due <= weekTimes.end ).sort((a,b) => a.due - b.due),
      weekTimes
    };
  }

  parseAssignmentOverrides(startTime, courses) {
    return this.overrides.map(o => {
      courses[o.course] = o.course;
      const due = startTime + o.offset;
      let dueDate = new Date();
      dueDate.setTime(due);
      return {
        id: `override-${o.name}-${due}`,
        name: o.name,
        course: o.course,
        desc: '',
        due, dueDate,
        points: o.points,
        url: ''
      };
    });
  }

  async generateAssignmentsEmbed(offset, filter) {
    const { courses, assignments, weekTimes } = await this.getWeeksAssignments(offset);
    const startDate = new Date();
    startDate.setTime(weekTimes.start);
    let fields = assignments.map(a => {
      return {
        name: courses[a.course],
        value: `${a.url ? `[${a.name}](${a.url})` : a.name}\nDue: ${a.dueDate.toUTCString()}\nPoints: ${a.points}`,
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
