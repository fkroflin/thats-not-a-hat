import { useEffect, useState } from 'react';
import socket from '../socket';

export default function Lobby({ room: initialRoom, onGameStart }) {
  const [room, setRoom] = useState(initialRoom);
  const isHost = room.hostId === socket.id;

  useEffect(() => {
    socket.on('player_joined', ({ players }) => {
      setRoom((prev) => ({ ...prev, players }));
    });

    socket.on('player_left', ({ players, hostId }) => {
      setRoom((prev) => ({ ...prev, players, hostId }));
    });

    socket.on('game_started', ({ room: updatedRoom }) => {
      onGameStart(updatedRoom);
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
    };
  }, [onGameStart]);

  function handleStartGame() {
    socket.emit('start_game');
  }

  return (
    <div className="screen lobby-screen">
      <h2>🎴 Game Lobby</h2>

      <div className="card">
        <p>Share this code with your friends:</p>
        <div className="room-code">{room.code}</div>
        <p className="meta">{room.rounds} rounds · {room.players.length}/4 players</p>
      </div>

      <div className="card">
        <h3>Players</h3>
        <ul className="player-list">
          {room.players.map((player) => (
            <li key={player.id}>
              {player.name}
              {player.id === room.hostId && <span className="badge">👑 Host</span>}
              {player.id === socket.id && <span className="badge you">You</span>}
            </li>
          ))}
        </ul>
        {room.players.length < 2 && (
          <p className="waiting">Waiting for at least one more player...</p>
        )}
      </div>

      {isHost ? (
        <button
          onClick={handleStartGame}
          disabled={room.players.length < 2}
          className={room.players.length < 2 ? 'disabled' : ''}
        >
          🚀 Start Game
        </button>
      ) : (
        <p className="waiting">Waiting for the host to start the game...</p>
      )}
    </div>
  );
}