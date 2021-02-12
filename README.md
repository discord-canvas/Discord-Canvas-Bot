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
  "course_filter": String?, // A regex filter for course names retrieved from canvas /courses
  "sam_course_filter": String?, // A regex filter for course names retrieved from SAM
  "sam_blocklist": [String]?, // List of courses to not fetch assignments for from SAM
  "question_directory": String?, // Relative path to directory containing questions
  "answer_directory": String?, // Relative path to directory containing answers
  "prefix": String?, // The bot command prefix (default "ca!"), its what is put before commands e.g. "ca!help"
  "overrides": [AssignmentOverride]?, // A list of assignment overrides
  "automated_assignments": [AutomatedAssignment]?, // List of automated assignment channels
}
```
```javascript
/** AssignmentOverride
* Defines extra assignments that will be shown in output
*/
{
  "offset": Number, // Offset in ms from start of week (monday 00:00) for when assignment is due (ms)
  "course": String, // Name of course assignment is for
  "name": String, // Name of assignment
  "points": Number, // Number of points assignment is worth
}
```
```javascript
/** AutomatedAssignment
* Defines channel that will automatically be send upcoming assignments
*/
{
  "offset": Number, // Offset from start of week of when to send message (ms)
  "channel": String, // Snowflake ID of channel to send to
}
```

### Setting up questions
In order to use `!hw` you will need to do two things: add screenshots of the questions to the `questions/` directory (the directory will soon be configurable) and create a JSON tree in `homework.json`.

#### Screenshots
While not directly required, you can alternatively add textual representations contained entirely in `homework.json`, if you do wish to add screenshots then this can be done by placing `.png` files into the `questions/` directory. Files must be named to match their equivalent path in `homework.json`, explained below. The `questions/` directory should not contain sub directories of screenshots, as they will be missed by the code. An example file name:
`111.1.1.a`
This corresponds to the question 1a of exercise 1 from module 111. To represent this in `homework.json`:

#### The JSON Tree
`homework.json` contains a nested structure of nodes, each representing a path that can be taken from the parent node. Usual tree stuff. Each node takes the form:
```haskell
data HomeworkNode = HomeworkNode {
  alt_desc :: String,
  image :: Bool,
  solution :: Bool,
  children :: {String: HomeworkNode}
}
```
The `solution` field is used by `!answer` to determine if a question is valid for sending (More below). If any field is empty, it will not be sent. For example, if we have the JSON:
```json
{
  "children": {
    "1": {
      "alt_desc": "Example 1",
      "image": true,
      "children": {
        "a": {
          "image": true
        },
        "b": {
          "alt_desc": "Example 1b: What is the meaning of life?"
        }
      }
    }
  }
}
 ```
If we call `!hw 1` we get a message containing "Example 1", the image called "1.png", and a list of sub-section names, "Subs: a, b".
If we call `!hw 1 a` we get a message containing only the image called "1.a.png", since that node has not `alt_desc` or `children` properties.
If we call `!hw 1 b` we get a message containing only "Example 1b: What is the meaning of life?", since that node only has an `alt_desc`.

### The `!answer` command
Similar to `!homework`, this command returns screenshots of answers to previous questions. It requires a path to a question with `solution: True`. It allows all the special syntax if `!homework`. 

## How to run
The bot requires 2 API keys, for canvas and discord. These are set via environment variables (you can also use dotenv).
```
DISCORD_TOKEN=Discord bot token
CANVAS_TOKEN=Canvas API token
SAM_TOKEN=SAM session token
```
With these variables set you can run the bot using
```bash
node .
```
