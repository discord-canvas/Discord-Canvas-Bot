const start = 1633690800;

const call = async function(message) {
  const time = Date.now() - start;
  await message.channel.send(`We have been watching tutorial for ${Math.round(time/1000/60)} minutes...`);
}

exports.name = '211';
exports.call = call;
