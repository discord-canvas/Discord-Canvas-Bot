'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');
const path = require('path');
const { asyncWrap } = require('./src/utils.js');

let activeChild;

async function awaitClose(child) {
  return new Promise((resolve) => {
    child.once('exit', function() {
      activeChild = undefined;
      return resolve.apply(this, arguments);
    });
    child.send({t: 'close'});
    child.disconnect();
  });
}

const REPO='http://github.com/discord-canvas/Discord-Canvas'; // TODO: Get this from git

async function doUpdate(child, message) {
  const git = simpleGit({
    baseDir: __dirname,
  });
  const log = await git.log();
  const status = await git.status();
  if (!status.isClean()) {
    child.send({ t: 'edit', msg: message.msg, chan: message.chan, content: `Unable to update, some files have been changed. Staying at <${REPO}/commit/${log.latest.hash}>`});
    return;
  }
  console.log('Closing old client...');
  await awaitClose(child);
  if (!child.killed) child.kill('SIGKILL');
  await git.checkout(process.env.GIT_BRANCH || 'master');
  console.log('Starting update...');
  let error, newLog;
  try {
    await git.pull();
    throw new Error('test');
    newLog = await git.log();
  } catch(e) {
    console.warn(e);
    await git.checkout(log.latest.hash);
    error = `Error downloading updates, reverting to old version <${REPO}/commit/${log.latest.hash}>`;
  }
  if (error === undefined) {
    try {
      await doNpmInstall();
    } catch(e) {
      console.warn(e);
      await git.checkout(log.latest.hash);
      error = `Error installing dependencies, reverting to old version <${REPO}/commit/${log.latest.has}>`;
    }
  }
  console.log('Update done, starting client');
  const newChild = start();
  newChild.once('ready', function() {
    if (error === undefined) {
      if (log.latest.hash !== newLog.latest.hash) {
        newChild.emit('send',{ t: 'edit', msg: message.msg, chan: message.chan,
          content: `Succesfully updated, <${REPO}/compare/${newLog.latest.hash}..${log.latest.hash}>`,
        });
      } else {
        newChild.emit('send', { t: 'edit', msg: message.msg, chan: message.chan,
          content: `Nothing to update, still at <${REPO}/commit/${newLog.latest.hash}>`,
       });
      }
    } else {
      newChild.emit('send', { t: 'edit', msg: message.msg, chan: message.chan, content: error.toString() });
    }
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
  if (activeChild !== undefined) throw new Error('A client already exists, cannot start');
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
  });
  activeChild = child;
  return events;
}

start();

async function _shutdown() {
  if (activeChild !== undefined) {
    console.log('Closing client...');
    await awaitClose(activeChild); 
    console.log('Client closed');
  }
  process.exit(0);
}

function shutdown() {
  _shutdown.apply(this, arguments).then(null, console.error);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
