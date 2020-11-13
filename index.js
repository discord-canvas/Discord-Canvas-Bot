'use strict';

require('dotenv').config();

const { spawn } = require('child_process');

const child = spawn(process.argv0, [`${__dirname}/src/index.js`], {
  cwd: __dirname,
  env: process.env,
  stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  serialization: 'json',
  shell: false,
});

child.on('message', console.log);
