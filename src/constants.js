'use strict';

exports.BOT_PERMISSIONS = Object.freeze([
  'SEND_MESSAGES',
  'MENTION_EVERYONE',
  'EMBED_LINKS',
  'ATTACH_FILES',
]);

exports.BOT_PRESENCE = Object.freeze({ status: 'online', activity: { type: 'WATCHING', name: 'canvas' }});

exports.DB_NAME = '.store.db';

exports.EMBED_COLOR = 0xff0000;

exports.USER_AGENT = 'DiscordCanvasBot/1.0';

exports.OPTS_HTML_PARSE = Object.freeze({
  lowerCaseTagNames: false,
  comment: false,
  blockTextElements: {
    script: false,
    noscript: false,
    style: false,
    pre: true
  }
});
