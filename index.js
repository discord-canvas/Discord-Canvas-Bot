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

const REMOTE = process.env.GIT_REMOTE || 'origin';
const BRANCH = process.env.GIT_BRANCH || 'master';

async function doUpdate(child, message) {
  const git = simpleGit({
    baseDir: __dirname,
  });
  const log = await git.log();
  const repo = (await git.remote(['get-url',REMOTE])).trim().replace(/\.git$/,'');
  const git_status = await git.status();
  if (hasGitChanged(git_status)) {
    child.send({ t: 'edit', msg: message.msg, chan: message.chan, content: { embed: {
      title: 'Error',
      description: `Some files have been changed. Staying at [${log.latest.hash.substring(0,6)}](${repo}/commit/${log.latest.hash})`,
      color: 0xff0000,
    }}});
    return;
  }
  console.log('Closing old client...');
  await awaitClose(child);
  if (!child.killed) child.kill('SIGKILL');
  await git.checkout(BRANCH);
  console.log('Starting update...');
  let error, newLog;
  const reset = async function() {
    await git.reset('hard');
    await git.checkout(log.latest.hash);
  };

  try {
    await git.pull();
    newLog = await git.log();
  } catch(e) {
    console.warn(e);
    await reset();
    error = `Error downloading updates, reverting to old version [${log.latest.hash.substring(0,6)}](${repo}/commit/${log.latest.hash})`;
  }
  if (error === undefined) {
    try {
      await doNpmInstall();
    } catch(e) {
      console.warn(e);
      await reset();
      error = `Error installing dependencies, reverting to old version [${log.latest.hash.substring(0,6)}](${repo}/commit/${log.latest.hash})`;
    }
  }
  console.log('Update done, starting client');
  const newChild = start(async function(exitCode) {
    if (exitCode === 0) return;
    await reset();
    const newErrorChild = start(); // If this child fails, there is nothing we can do
    newErrorChild.emit('send',{ t: 'edit', msg: mesasge.msg, chan: message.chan,
      content: { embed: {
        title: 'Problem with new version',
        description: `[${newLog.latest.hash.substring(0,6)}](${repo}/commit/${newLog.latest.hash}) exited with code \`${exitCode}\`, reverted to [${log.latest.hash}](${repo}/commit/${log.latest.hash})`,
        color: 0xff0000,
      }},
    });
  });
  newChild.once('ready', function() {
    if (error === undefined) {
      if (log.latest.hash !== newLog.latest.hash) {
        newChild.emit('send',{ t: 'edit', msg: message.msg, chan: message.chan,
          content: { embed: {
            title: 'Succesfully updated',
            description: `Updated to [${newLog.latest.hash.substring(0,6)}](${repo}/compare/${log.latest.hash}..${newLog.latest.hash})`,
            color: 0x00ff00,
          }},
        });
      } else {
        newChild.emit('send', { t: 'edit', msg: message.msg, chan: message.chan,
          content: { embed: {
            title: 'Nothing to update',
            description: `Still at [${newLog.latest.hash.substring(0,6)}](${repo}/commit/${newLog.latest.hash})`,
            color: 0x00ff00,
          }},
       });
      }
    } else {
      newChild.emit('send', { t: 'edit', msg: message.msg, chan: message.chan,
        content: { embed: {
          title: 'Error updating',
          description: error.toString(),
          color: 0xff0000,
        }}
      });
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

function hasGitChanged(git_status) {
  if (!git_status.isClean()) {
    for (let file of git_status.files) {
      if (!['package.json','package-lock.json'].includes(file.path))
        return true;
    }
  }
  return false;
}

async function restart(child, message) {
  console.log('Closing old client...');
  await awaitClose(child);
  if (!child.killed) child.kill('SIGKILL');
  console.log('Starting client');
  const newChild = start();
  newChild.once('ready', function() {
    newChild.emit('send',{ t: 'edit', msg: message.msg, chan: message.chan,
      content: { embed: {
        title: 'Succesfully restarted',
        color: 0x00ff00,
      }},
    });
  });
}

function start(onExit) {
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
  child.once('exit', function() {
    console.log('Client shutdown...');
    if (onExit !== undefined) onExit.apply(this, arguments);
  });
  events.on('update', asyncWrap(doUpdate) );
  events.on('shutdown', shutdown);
  events.on('restart', asyncWrap(restart));
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
