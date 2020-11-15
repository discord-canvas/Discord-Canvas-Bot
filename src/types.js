'use strict';

const { isOfBaseType } = require('@douile/bot-utilities');

function TypeOrUndefined(type) {
  return function(value) {
    if (value === undefined) return undefined;
    return type(value);
  }
}

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
* @param {String} id
* @param {String} name
*/
const Course = Object.freeze({
  id: String,
  name: String,
});

/**
* Assignment object
* @typedef {Object} Assignment
* @param {String} id
* @param {Week} week
* @param {Number} due
* @param {Course} course
* @param {String} name
* @param {String} url
* @param {Number} points
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
* @param {String} messageID
* @param {String} channelID
* @param {Week} week
*/
const Message = Object.freeze({
  messageID: String,
  channelID: String,
  /* week: Week, */
});

/**
* Week object
* @typedef {Object} Week
* @param {Number} start
* @param {Number} end
* @param {Array.<Assignment>} assignments
* @param {Array.<Message>} messages
*/
const Week = Object.freeze({
  start: Number,
  end: Number,
  assignments: [Assignment],
  messages: [Message],
});

module.exports = {Week, Assignment, Course, Message, enforceType};
