# Canvas / Homework bot

## What it does
This is a discord bot that has two main features, canvas upcoming assignments and homework questions.
- Upcoming assignments and discussions topics are fetched from canvas API and accessible to users via the `!thisweek` and `!nextweek` commands, this displays the module name, assignment name, due date and points (if available).
- Homework questions allows users to post pictures of homework questions/answers (after solutions posted) to chat using the `!hw` command.

## How to setup
This project should work with node.js version 10 upwards but is mainly tested on version 14 LTS.

```bash
# Install dependencies
npm install --no-optional
# Setup sqlite3 database
npm run init-db
# Copy example config
npm run init-config
```

### Configuring
Configuration of the bot is done in the `.config.json` file, there is an example of this file in [.config.example.json](./.config.example.json)
```javascript
{
  "api": String, // The base URL of the canvas API
  "course_filter": String, // A regex filter for course names retrieved from /courses
  "prefix": String, // The bot command prefix (default "ca!"), its what is put before commands e.g. "ca!help"
  "overrides": [AssignmentOverride] // A list of assignment overrides
}
```
```javascript
/** AssignmentOverride
* Defines extra assignments that will be shown in output
*/
{
  "offset": Number, // Offset in ms from start of week (monday 00:00) for when assignment is due
  "course": String, // Name of course assignment is for
  "name": String, // Name of assignment
  "points": Number // Number of points assignment is worth
}
```

## How to run
The bot requires 2 API keys, for canvas and discord. These are set via environment variables (you can also use dotenv).
```
DISCORD_TOKEN=Discord bot token
CANVAS_TOKEN=Canvas API token
```
With these variables set you can run the bot using
```bash
node .
```
