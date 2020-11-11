'use strict';

exports.BOT_PERMISSIONS = Object.freeze([
  'SEND_MESSAGES',
  'MENTION_EVERYONE',
  'EMBED_LINKS',
  'ATTACH_FILES',
]);

exports.BOT_PRESENCE = Object.freeze({ status: 'online', activity: { type: 'WATCHING', name: 'canvas' }});

exports.DB_NAME = '.store.db';
