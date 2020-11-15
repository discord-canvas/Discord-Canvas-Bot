#!/usr/bin/env node

const FILENAME = '.store.db';

const fs = require('fs').promises;
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(FILENAME, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

db.on('error', function() {
  console.error.apply(this, arguments);
  db.close();
})

db.once('open', async function() {
  const sql = await fs.readFile(`${__dirname}/create-tables.sql`, {encoding: 'utf-8'});
  console.log('Writing to database...');
  console.log(sql);
  db.exec(sql, function(err) {
    if (err !== null) return console.error(err);
    console.log('Success');
    db.close();
  })
})
