'use strict';

const { upcomingAssignments } = require('./templates/assignments.js');

exports.name = 'nextweek';
exports.call = upcomingAssignments(1);
exports.help = 'Output assignments due next week';
