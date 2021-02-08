'use strict';

const fetch = require("node-fetch");
const HTMLParser = require('node-html-parser');

const { USER_AGENT, OPTS_HTML_PARSE } = require('./constants.js');

const URL = 'https://sam.csc.liv.ac.uk/COMP/CW_List.pl';
const AUTH_COOKIE = '/var/www/SAM/CJar/InterViewMgr_COMP';

const RE_NBSP = /&nbsp/g;

const req = async function(url, {sessionCookie, method, body, mimeType }) {
  return await fetch(url, {
    method, body, headers: {
      'User-Agent': USER_AGENT,
      'Cookie': `${encodeURIComponent(AUTH_COOKIE)}=${encodeURIComponent(sessionCookie)}`,
      'Content-Type': mimeType
    }
  });
}

const get = function(url, sessionCookie) {
  return req(url, {sessionCookie, method: 'GET'});
}

const post = function(url, sessionCookie, body) {
  return req(url, {sessionCookie, method: 'POST', body, mimeType: 'application/x-www-form-urlencoded' });
}


class Sam {
  constructor(token, options) {
    if (typeof token !== 'string' || token.length === 0) throw new Error('Invalid API token');
    this.token = token;
    this.options = options || {};
  }
}

/**
* getCourses
* fetch and parse a list available courses
* @param {String} sessionCookie - Your SAM login session cookie
* @returns {Array.<String>} list of module names
*/
const getCourses = async function() {
  const res = await get(URL, this.token);
  const text = await res.text();

  const html = HTMLParser.parse(text, OPTS_HTML_PARSE);

  const moduleSelect = html.querySelector('select[NAME="qryModule"]');
  if (moduleSelect === null) throw new Error('Could not find modules');

  const moduleElements = moduleSelect.querySelectorAll('OPTION');

  const modules = moduleElements.map(el => el.getAttribute('VALUE'));
  return modules;
}
Sam.prototype.getCourses = getCourses;


/**
* getFilteredCourses
* fetch a list of available courses and filter them
*/
const getFilteredCourses = async function() {
  const courses = await this.getCourses();
  const regex = new RegExp(this.options.sam_course_filter, 'g');
  return courses.filter(course => course.match(regex) !== null && !this.options.sam_blocklist.includes(course));
}
Sam.prototype.getFilteredCourses = getFilteredCourses;


/**
* getCourseAssignments
* fetch and parse the list of assignmens for given module
* @param {String} sessionCookie - Your SAM login session cookie
* @param {String} course - Name of module
* @returns {Array.<Assignment>} assignments for given module
*/
const getCourseAssignments = async function(course) {
  const res = await post(URL, this.token, `qryModule=${encodeURIComponent(course)}`);
  const text = await res.text();

  const html = HTMLParser.parse(text, OPTS_HTML_PARSE);

  const assignmentRows = html.querySelectorAll('TABLE.general TR');

  const assignmentData = assignmentRows.map(el => el.querySelectorAll('TD')).filter(d => d.length === 4);

  return assignmentData.map(td => {
    const [course] = td[0].structuredText.split('\n');
    const [id, name] = td[1].structuredText.split('\n');
    const due = td[2].structuredText;
    const a = td[3].querySelector('A');
    const url = a === null ? undefined : a.getAttribute('href');
    const dueDate = new Date(due);
    return { id: `SAM-${course}-${id}`, name: name.replace(RE_NBSP,'').trim(), course, due: dueDate.getTime(), dueDate, points: 1, url };
  })
}
Sam.prototype.getCourseAssignments = getCourseAssignments;

module.exports = Sam;
