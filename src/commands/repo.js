
async function call(msg, args) {
  await msg.channel.send({embed: {
    title: 'Bot Repository',
    color: 0xff0000,
    fields: {value: "https://github.com/CammyFentreux/Discord-Canvas-Bot", name: "GitHub:"}
  }})
}
// fields: assignments.map(a => {
//   return {
//     name: courses[a.course],
//     value: `[${a.name}](${a.url})\nDue: ${a.dueDate.toUTCString()}\nPoints: ${a.points}`,
//     inline: false
//   }
// })

exports.name = 'repo'
exports.call = call
exports.help = 'Output assignments due next week'
