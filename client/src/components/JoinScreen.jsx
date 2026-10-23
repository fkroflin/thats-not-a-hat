import { useState } from 'react';
import socket from '../socket';

export default function JoinScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [rounds, setRounds] = useState(5);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');

  socket.once('join_error', ({ message }) => {
    setError(message);
  });

  function handleCreate() {
    if (!name.trim()) return setError('Please enter your name.');
    setError('');
    socket.emit('create_room', { playerName: name.trim(), rounds });
  }

  function handleJoin() {
    if (!name.trim()) return setError('Please enter your name.');
    if (!roomCode.trim()) return setError('Please enter a room code.');
    setError('');
    socket.emit('join_room', { playerName: name.trim(), roomCode: roomCode.trim().toUpperCase() });
  }

  return (
    <div className="screen join-screen">
      <h1>🎴 That's Not a Hat!</h1>
      <p className="subtitle">A memory game where your friends will lie to your face.</p>

      <div className="card">
        <label>Your name</label>
        <input
          type="text"
          placeholder="e.g. Alice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />

        {!mode && (
          <div className="button-row">
            <button onClick={() => setMode('create')}>➕ Create Room</button>
            <button onClick={() => setMode('join')} className="secondary">🔗 Join Room</button>
          </div>
        )}

        {mode === 'create' && (
          <>
            <label>Rounds</label>
            <select value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
              <option value={3}>3 rounds</option>
              <option value={5}>5 rounds (default)</option>
              <option value={7}>7 rounds</option>
              <option value={10}>10 rounds</option>
            </select>
            <div className="button-row">
              <button onClick={handleCreate}>Create Game</button>
              <button onClick={() => setMode(null)} className="ghost">← Back</button>
            </div>
          </>
        )}

        {mode === 'join' && (
          <>
            <label>Room code</label>
            <input
              type="text"
              placeholder="e.g. LION42"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <div className="button-row">
              <button onClick={handleJoin}>Join Game</button>
              <button onClick={() => setMode(null)} className="ghost">← Back</button>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}