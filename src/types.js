'use strict';

const { isOfBaseType } = require('@douile/bot-utilities');

function TypeOrUndefined(type) {
  return function(value) {
    if (value === undefined) return undefined;
    return type(value);
  }
}

function TypeOrDefault(type, defaultValue) {
  return function(value) {
    if (isOfBaseType(value, type)) return value;
    return defaultValue;
  }
}

// Type script? Never heard of it mate
function enforceType(type, value) {
  if (isOfBaseType(type, Object)) {
    if (value === undefined) {
      value = {};
    }
    for (let k in type) {
      value[k] = enforceType(type[k], value[k]);
    }
  } else if (isOfBaseType(type, Array)) {
    if (value === undefined) {
      value = [];
    } else if (!isOfBaseType(value, Array)) {
      value = Array(value);
    }
    for (let i=0;i<value.length;i++) {
      value[i] = enforceType(type[0], value[i]);
    }
  } else if (isOfBaseType(type, Function)) {
    value = type(value);
  }
  return value;
}

/**
* Course object
* @typedef {Object} Course
* @param {String} id - Canvas ID of course
* @param {String} name - Name of course
*/
const Course = Object.freeze({
  id: String,
  name: String,
});

/**
* Assignment object
* @typedef {Object} Assignment
* @param {String} id - Canvas ID of assignment
* @param {Week} week - Reference to week this assignment is part of
* @param {Number} due - Unix time for when assignment is due
* @param {Course} course - Reference to this assignment's course
* @param {String} name - Name of this assignment
* @param {String} url - Link to canvas page for this assignment
* @param {Number} points - Points assignment is worth
*/
const Assignment = Object.freeze({
  id: String,
  /*week: Week,*/
  due: Number,
  course: Course,
  name: String,
  url: TypeOrUndefined(String),
  points: Number,
});

/**
* Message object
* @typedef {Object} Message
* @param {String} messageID - Snowflake ID of message
* @param {String} channelID - Snowflake ID of channel
* @param {Week} week - Reference to week object
*/
const Message = Object.freeze({
  messageID: String,
  channelID: String,
  /* week: Week, */
});

/**
* Week object
* @typedef {Object} Week
* @param {Number} start - Unix time for start of week (also used as ID)
* @param {Number} end - Unix time for end of week
* @param {Array.<Assignment>} assignments - List of week's assignments
* @param {Array.<Message>} messages - List of week's auto-update messages
*/
const Week = Object.freeze({
  start: Number,
  end: Number,
  assignments: [Assignment],
  messages: [Message],
});

/**
* Config override
* Adds additional assignments to week-by-week
* @typedef {Object} ConfigOverride
* @param {Number} offset
* @param {String} course
* @param {String} name
* @param {Number} points
*/
const ConfigOverride = Object.freeze({
  offset: Number,
  course: String,
  name: String,
  points: Number,
});

/**
* Automated assignments update
* @typedef {Object} ConfigAutomatedAssignment
* @param {Number} offset
* @param {String} channel
*/
const ConfigAutomatedAssignment = Object.freeze({
  offset: Number,
  channel: String,
})

/**
* Config
* @typedef {Object} Config
* @param {String} api
* @param {String} course_filter
* @param {String} prefix
* @param {Array.<ConfigOverride>} overrides
* @param {Array.<ConfigAutomatedAssignment>} automated_assignments
*/
const Config = Object.freeze({
  api: TypeOrDefault(String, 'https://instructure.com/api/v1'),
  course_filter: TypeOrDefault(String, '(.*)'),
  sam_course_filter: TypeOrDefault(String, '.'),
  sam_blocklist: TypeOrDefault(Array, []),
  question_directory: TypeOrDefault(String, "questions/"),
  answer_directory: TypeOrDefault(String, "answers/"),
  prefix: TypeOrDefault(String, 'ca!'),
  overrides: [ConfigOverride],
  automated_assignments: [ConfigAutomatedAssignment],
});

module.exports = {
  Week, Assignment, Course, Message,
  Config, ConfigOverride, ConfigAutomatedAssignment,
  enforceType,
};
