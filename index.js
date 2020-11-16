'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');
const path = require('path');
const { asyncWrap } = require('./src/utils.js');

async function awaitClose(child) {
  return new Promise((resolve) => {
    child.once('exit', resolve);
    child.send({t: 'close'});
    child.disconnect();
  });
}

async function doUpdate(child, message) {
  const git = simpleGit({
    baseDir: __dirname,
  });
  const log = await git.log();
  const status = await git.status();
  if (!status.isClean()) {
    child.send({ t: 'edit', msg: message.msg, chan: message.chan, content: `Unable to update from \`${log.latest.hash}\`: repo not clean`});
    return;
  }
  console.log('Closing old client...');
  await awaitClose(child);
  if (!child.killed) child.kill('SIGKILL');
  console.log('Starting update...');
  await git.pull();
  const newLog = await git.log();
  await doNpmInstall();
  const newChild = start();
  newChild.once('ready', function() {
    newChild.emit('send',{ t: 'edit', msg: message.msg, chan: message.chan, content: `Succesfully updated from \`${log.latest.hash}\` to \`${newLog.latest.hash}\``});
  });
}

function doNpmInstall() {
  return new Promise((resolve, reject) => {
    const npm = spawn(path.join(path.dirname(process.argv0),'npm'), ['install'], {
      cwd: __dirname,
      env: { PATH: process.env.PATH },
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: false
    });
    npm.once('exit', function(exitCode, signal) {
      if (exitCode === 0) return resolve(exitCode);
      reject(exitCode, signal);
    })
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
  events.on('send', function(message) {
    child.send(message);
  })
  return events;
}

start();
