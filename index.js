'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');
const git = simpleGit({
  baseDir: __dirname,
});

const { asyncWrap } = require('./src/utils.js');

async function awaitClose(child) {
  return new Promise((resolve) => {
    child.once('exit', resolve);
    child.send({t: 'close'});
  });
}

async function doUpdate(child, message) {
  const log = await git.log();
  const status = await git.status();
  if (!status.isClean()) {
    child.send({ t: 'edit', msg: message.msg, chan: message.chan, content: `Unable to update from \`${log.latest.hash}\`: repo not clean`});
    return;
  }
  console.log('Closing old client...');
  await awaitClose(child);
  console.log('Starting update...');
  await git.pull();
  const newLog = await git.log();
  const newChild = start();
  newChild.once('ready', function() {
    newChild.send({ t: 'edit', msg: message.msg, chan: message.chan, content: `Succesfully updated from \`${log.latest.hash}\` to \`${newLog.latest.hash}\``});
  })
}

function start() {
  const events = new EventEmitter();
  const child = spawn(process.argv0, [`${__dirname}/src/index.js`], {
    cwd: __dirname,
    env: process.env,
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    serialization: 'json',
    shell: false,
  });
  child.on('error', console.error);
  child.on('message', function(message) {
    events.emit(message.t, child, message);
  });
  events.on('update', asyncWrap(doUpdate) );
  return events;
}

start();
