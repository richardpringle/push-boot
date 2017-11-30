const { Socket } = require('net');
const { fork } = require('child_process');
const { Interface } = require('readline');
const { stdin, stdout } = process;

const interface = new Interface(stdin, stdout);

interface.on('SIGINT', () => {
  process.exit(0);
});

const child = fork('./slave.js', {
  stdio: [
    'pipe',
    'inherit',
    'inherit',
    'ipc',
  ]
});

process.on('exit', () => child.kill());

const socket = new Socket();

const config = {
  get: [
    {
      path: '/hello',
      response: 'world\n',
    }
  ]
}

child.on('message', message => {
  if (message === 'ready');

  rebuild();

  interface.question('test out curl localhost:3000/hello in a different shell\n', () => {
    getNewPath();
  });
})

function getNewPath() {
  interface.question('specify a new GET path: ', answer => {
    if (answer[0] !== '/') answer = `/${answer}`;
    const path = answer;

    interface.question('specify a string response: ', answer => {
      if (answer[answer.lengh - 1] !== '\n') answer += '\n';
      const response = answer;

      config.get.push({ path, response });
      rebuild();
      interface.question('now try it out with curl in a different shell!', () => {
        getNewPath();
      })
    });
  });
}

function rebuild() {
  socket.connect(1337);
  socket.end(JSON.stringify(config));
}
