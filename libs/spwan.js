const { spawn } = require('child_process');

module.exports.spawnChild = async function (command, args) {
  const child = spawn(command, args);

  return new Promise((resolve) => {
    child.stdout.on("data", (x) => {
      process.stdout.write(x.toString());
    });
    child.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    child.on("exit", (code) => {
      resolve(code);
    });
  });
}