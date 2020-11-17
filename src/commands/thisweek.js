'use strict';

const { upcomingAssignments } = require('./templates/assignments.js');

exports.name = ['thisweek', 'tw'];
exports.call = upcomingAssignments();
exports.help = 'Output assignments due this week\n`!thisweek [filter]` e.g. `!thisweek 105`';
