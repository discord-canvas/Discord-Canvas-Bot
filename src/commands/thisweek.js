'use strict';

const { upcomingAssignments } = require('./templates/assignments.js');

exports.name = 'thisweek';
exports.call = upcomingAssignments();
exports.help = 'Output assignments due next week\n`!thisweek [filter]` e.g. `!thisweek 105`';;
