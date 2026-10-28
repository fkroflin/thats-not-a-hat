const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameEngine = require('./GameEngine');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = {};

function generateRoomCode() {
  const words = ['LION', 'CAKE', 'STAR', 'MOON', 'FISH', 'BIRD', 'DUCK', 'FROG', 'BEAR', 'WOLF'];
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 90 + 10);
}

function broadcastState(code, engine) {
  if (!engine) return;
  const publicState = engine.getPublicState();
  io.to(code).emit('game_state', publicState);

  engine.players.forEach((player) => {
    const socket = io.sockets.sockets.get(player.id);
    if (socket) {
      socket.emit('private_state', engine.getPrivateState(player.id));
    }
  });
}

io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  socket.on('create_room', ({ playerName, rounds }) => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName }],
      status: 'lobby',
      rounds: rounds || 5,
      engine: null,
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;
    console.log(`🏠 Room created: ${code} by ${playerName}`);
    socket.emit('room_joined', { room: rooms[code] });
  });

  socket.on('join_room', ({ playerName, roomCode }) => {
    const code = roomCode.toUpperCase();
    const room = rooms[code];
    if (!room) return socket.emit('join_error', { message: `Room "${code}" does not exist.` });
    if (room.status !== 'lobby') return socket.emit('join_error', { message: 'That game has already started.' });
    if (room.players.length >= 4) return socket.emit('join_error', { message: 'Room is full (max 4 players).' });

    room.players.push({ id: socket.id, name: playerName });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;
    console.log(`👤 ${playerName} joined room ${code}`);
    socket.emit('room_joined', { room });
    socket.to(code).emit('player_joined', { players: room.players });
  });

  socket.on('start_game', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) return socket.emit('join_error', { message: 'Need at least 2 players.' });

    room.status = 'playing';
    room.engine = new GameEngine(room);
    console.log(`🎮 Game started in room ${code}`);

    io.to(code).emit('game_started', { room });
    broadcastState(code, room.engine);
  });

  socket.on('flip_cards_face_down', () => {
    const code = socket.data.roomCode;
    const engine = rooms[code]?.engine;
    if (!engine) return;

    const result = engine.flipAllCardsFaceDown();
    if (result.error) return socket.emit('game_error', { message: result.error });

    broadcastState(code, engine);
  });

  socket.on('pass_card', ({ toId, claim }) => {
    const code = socket.data.roomCode;
    const engine = rooms[code]?.engine;
    if (!engine) return;

    const result = engine.passCard(socket.id, toId, claim);
    if (result.error) return socket.emit('game_error', { message: result.error });

    broadcastState(code, engine);
  });

  socket.on('accept_card', () => {
    const code = socket.data.roomCode;
    const engine = rooms[code]?.engine;
    if (!engine) return;

    const result = engine.acceptCard(socket.id);
    if (result.error) return socket.emit('game_error', { message: result.error });

    broadcastState(code, engine);
  });

  socket.on('challenge_card', () => {
    const code = socket.data.roomCode;
    const engine = rooms[code]?.engine;
    if (!engine) return;

    const result = engine.challengeCard(socket.id);
    if (result.error) return socket.emit('game_error', { message: result.error });

    broadcastState(code, engine);

    setTimeout(() => {
      if (engine.phase === 'challenge_reveal') {
        engine.afterReveal();
        broadcastState(code, engine);
      }
    }, 4000);
  });

  socket.on('flip_replacement_card', () => {
    const code = socket.data.roomCode;
    const engine = rooms[code]?.engine;
    if (!engine) return;

    const result = engine.flipReplacementCardFaceDown();
    if (result.error) return socket.emit('game_error', { message: result.error });

    broadcastState(code, engine);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== socket.id);
    console.log(`❌ ${socket.data.playerName} left room ${code}`);

    if (room.players.length === 0) {
      delete rooms[code];
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    if (room.engine) {
      const player = room.engine.players.find((p) => p.id === socket.id);
      if (player) {
        player.eliminated = true;
        room.engine.lastEvent = `${player.name} disconnected and was eliminated.`;
      }
      broadcastState(code, room.engine);
    } else {
      io.to(code).emit('player_left', { players: room.players, hostId: room.hostId });
    }
  });

  socket.on('get_game_state', () => {
  const code = socket.data.roomCode;
  const engine = rooms[code]?.engine;
  if (engine) {
    socket.emit('game_state', engine.getPublicState());
    socket.emit('private_state', engine.getPrivateState(socket.id));
  }
  });
});

app.get('/', (req, res) => res.send('ThatsNotAHat server is running!'));

const PORT = process.env.PORT || 3001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`👉 Run 'Stop-Process -Name node -Force' in PowerShell to kill any old instances.`);
  } else {
    console.error('❌ Server error:', err);
  }
});

server.listen(PORT, () => console.log(`🎴 Server on port ${PORT}`));


