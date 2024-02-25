const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const Game = require("./src/game");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '/public/index.html'));
});

Game.initSocketConnection(io)

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});