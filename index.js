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

const REPO='http://github.com/discord-canvas/Discord-Canvas'; // TODO: Get this from git

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
  await git.checkout('master'); // TODO: Make branch configurable
  console.log('Starting update...');
  let error;
  try {
    await git.pull();
    const newLog = await git.log();
  } catch(e) {
    console.warn(e);
    await git.checkout(log.latest.hash);
    error = `Error downloading updates, reverting to old version <${REPO}/commit/${log.latest.hash}>`;
  }
  if (error !== undefined) {
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
