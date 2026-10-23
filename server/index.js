const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  socket.on('create_room', ({ playerName, rounds }) => {
    const code = generateRoomCode();
    const player = { id: socket.id, name: playerName };

    rooms[code] = {
      code,
      hostId: socket.id,
      players: [player],
      status: 'lobby',
      rounds: rounds || 5,
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

    if (!room) {
      socket.emit('join_error', { message: `Room "${code}" does not exist.` });
      return;
    }
    if (room.status !== 'lobby') {
      socket.emit('join_error', { message: 'That game has already started.' });
      return;
    }
    if (room.players.length >= 4) {
      socket.emit('join_error', { message: 'Room is full (max 4 players).' });
      return;
    }

    const player = { id: socket.id, name: playerName };
    room.players.push(player);

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

    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('join_error', { message: 'Only the host can start the game.' });
      return;
    }
    if (room.players.length < 2) {
      socket.emit('join_error', { message: 'Need at least 2 players to start.' });
      return;
    }

    room.status = 'playing';
    console.log(`🎮 Game started in room ${code}`);

    io.to(code).emit('game_started', { room });
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== socket.id);
    console.log(`❌ ${socket.data.playerName} left room ${code}`);

    if (room.players.length === 0) {
      delete rooms[code];
      console.log(`🗑️  Room ${code} deleted (empty)`);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        console.log(`👑 New host in ${code}: ${room.players[0].name}`);
      }
      io.to(code).emit('player_left', { players: room.players, hostId: room.hostId });
    }
  });
});

app.get('/', (req, res) => res.send('ThatsNotAHat server is running!'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🎴 Server on port ${PORT}`));