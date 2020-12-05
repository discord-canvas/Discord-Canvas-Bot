'use strict';

const fetch = require("node-fetch");

const { USER_AGENT } = require('./constants.js');

const PAGE_LENGTH = 50;

const RE_LINKURL = /<([^>]+)>/g;
const RE_LINKREL = /rel="([^"]+)"/g;

let bucket = { remaining: undefined };

const req = Object.freeze({
  'get': async function(url, auth, headers) {
    if (!headers) headers = {};
    headers['Authorization'] = `Bearer ${auth}`;
    if (!('User-Agent' in headers)) headers['User-Agent'] = USER_AGENT;
    console.log('GET', String(url));
    const res = await fetch(url, {headers});
    bucket.remaining = parseFloat(res.headers.get('X-Rate-Limit-Remaining'));
    return res;
  },
  'getJson': async function(url, auth, headers) {
    const res = await req.get(url, auth, headers);
    if (res.ok) return await res.json();
    throw new Error(`Fetch error ${res.status} ${res.statusText}`);
  },
  'getPaginated': async function(url, auth, headers) {
    if (!(url instanceof URL)) {
      url = new URL(url);
    }
    url.searchParams.set('page', '1');
    url.searchParams.set('per_page', PAGE_LENGTH);
    let responses = [];
    let cond = true
    while (cond) {
      const res = await req.get(url, auth, headers);
      if (!res.ok) throw new Error(`Fetch error ${res.status} ${res.statusText}`);
      responses.push(await res.json());
      let links = parseLinks(res.headers.get('Link'));

      if ('next' in links) {
        url = links.next;
      } else {
        cond = false;
      }
      if (links.current === links.last) cond = false;
    }
    return responses.flat();
  }
});

function parseLinks(linkString) {
  let links = {}, linkStrings = linkString.split(',');
  for (let link of linkStrings) {
    let [ url, rel ] = link.split(';');
    RE_LINKURL.lastIndex = 0;
    let urlMatch = RE_LINKURL.exec(url);
    if (urlMatch === null) continue;
    RE_LINKREL.lastIndex = 0;
    let relMatch = RE_LINKREL.exec(rel);
    if (relMatch === null) continue;
    links[relMatch[1]] = urlMatch[1];
  }
  return links;
}

class Canvas {
  constructor(token, options) {
    if (typeof token !== 'string' || token.length === 0) throw new Error('Invalid API token');
    this.token = token;
    this.options = options || {};
  }

  get api() {
    return this.options.api;
  }

  get courseFilter() {
    return new RegExp(this.options.course_filter, 'g');
  }

  async getCourses() {
    return req.getPaginated(`${this.api}/courses`, this.token);
  }

  async getFilteredCourses() {
    const courses = await this.getCourses();
    let res = {};
    for (let course of courses) {
      const match = Array.from(course.name.matchAll(this.courseFilter));
      if (match.length > 0) {
        res[course.id] = match[0][1];
      }
    }
    return res;
  }

  async getCourseTodo(courseID) {
    return req.get(`${this.api}/courses/${courseID}/todo`, this.token);
  }

  async getCourseAssignments(courseID) {
    const assignments = await req.getPaginated(`${this.api}/courses/${courseID}/assignments`, this.token);
    return assignments.map(a => {
      let due = Date.parse(a.due_at);
      let dueDate = new Date();
      dueDate.setTime(due);
      return {id: a.id, name: a.name, course: a.course_id, due, dueDate, points: a.points_possible, url: a.html_url };
    });
  }

  async getCourseDiscussions(courseID) {
    const discussions = await req.getPaginated(`${this.api}/courses/${courseID}/discussion_topics`, this.token);
    return discussions.filter(d => d.lock_at !== null).map(d => {
      let due = Date.parse(d.lock_at);
      let dueDate = new Date();
      dueDate.setTime(due);
      return {id: d.id, name: d.title, course: courseID, desc: d.message, due, dueDate, points: 0, url: d.html_url };
    })
  }

  async getCalenderEvents(contexts, startDate, endDate) {
    let url = new URL(`${this.api}/calendar_events`);
    url.searchParams.append('context_codes[]', contexts.join(','));
    url.searchParams.append('type', 'event');
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('per_page', '5');
    url.searchParams.append('excludes[]', 'description,child_events,assignment');
    return await req.get(url, this.token);
  }

  async plannerEvents(contexts, startDate, endDate, filter) {
    let url = new URL(`${this.api}/planner/items`);
    url.searchParams.append('context_codes[]', contexts.join(','));
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('per_page', '50');
    if (filter) url.searchParams.append('filter', 'ungraded_todo_items');
    return req.get(url, this.token);
  }
}

module.exports = Canvas;
