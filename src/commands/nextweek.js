'use strict';

const { upcomingAssignments } = require('./templates/assignments.js');

exports.name = ['nextweek', 'nw'];
exports.call = upcomingAssignments(1);
exports.help = 'Output assignments due next week\n`!nextweek [filter]` e.g. `!nextweek 105`';
