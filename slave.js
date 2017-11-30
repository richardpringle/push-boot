const express = require('express');
const cluster = require('cluster');
const cpus = require('os').cpus();
const { Server } = require('net');

if (cluster.isMaster) {
  cpus.forEach(() => cluster.fork());

  const server = new Server();
  server.on('connection', handleConfigPush.bind(cluster));

  server.listen(1337, () => {
    process.send('ready'); // tell master.js that the server is listening
    console.log('master listening on 1337')
  });
} else {
  let server = null;
  // config
  // { get: [{ path: 'hello', response: 'world' }]}
  // the followig callback can be replaced with real app bootstrapping
  process.on('message', config => {
    console.log('spawned');

    if (server) server.close();

    const app = express();

    Object.entries(config).forEach(([key, routes]) => {
      routes.forEach(route => {
        app[key](route.path, (req, res) => {
          res.end(route.response);
        });
      });
    });

    app.use((req, res) => {
      res.end(`You didn't add "${req.path}" as a path!\n`);
    });

    server = app.listen(3000, () => {
      console.log('slave listening on 3000');
      process.send('ready');
    });
  });
}

function handleConfigPush(socket) {
  if (!this || !this.isMaster) {
    throw new Error('handleConfigPush must be called from a cluser instance');
  }

  socket.setEncoding('utf8');
  let data = '';
  socket.on('data', d => { data += d });
  socket.on('end', () => startNext(this, JSON.parse(data)));
}

function startNext(cluster, config, workerIndex = 1) {
  const worker = cluster.workers[workerIndex++];
  if (!worker) return;

  worker.once('message', message => {
    if (message === 'ready') {
      startNext(cluster, config, workerIndex);
    }
  });

  worker.send(config);
}
