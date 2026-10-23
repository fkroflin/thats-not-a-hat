import { useState } from 'react';
import socket from './socket';
import JoinScreen from './components/JoinScreen';
import Lobby from './components/Lobby';
import './App.css';


export default function App() {
  const [screen, setScreen] = useState('join');
  const [room, setRoom] = useState(null);

  socket.once('room_joined', ({ room }) => {
    setRoom(room);
    setScreen('lobby');
  });

  function handleGameStart(updatedRoom) {
    setRoom(updatedRoom);
    setScreen('game');
  }

  return (
    <div className="app">
      {screen === 'join' && <JoinScreen />}
      {screen === 'lobby' && <Lobby room={room} onGameStart={handleGameStart} />}
      {screen === 'game' && (
        <div className="screen">
          <h2>🎮 Game starting...</h2>
          <p>Phase 3 coming soon!</p>
        </div>
      )}
    </div>
  );
}