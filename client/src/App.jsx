import { useState, useEffect } from 'react';
import socket from './socket';
import JoinScreen from './components/JoinScreen';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import './App.css';
import Chat from './components/Chat';

export default function App() {
  const [screen, setScreen] = useState('join');
  const [room, setRoom] = useState(null);

  useEffect(() => {
    socket.on('room_joined', ({ room }) => {
      setRoom(room);
      setScreen('lobby');
    });

    socket.on('game_started', (data) => {
      if (data?.room) setRoom(data.room);
      setScreen('game');
    });

    return () => {
      socket.off('room_joined');
      socket.off('game_started');
    };
  }, []);

  function handleGameStart(updatedRoom) {
    if (updatedRoom) setRoom(updatedRoom);
    setScreen('game');
  }

  function handleGameEnd() {
    setScreen('join');
    setRoom(null);
  }

    return (
    <div className="app">
      {screen === 'join' && <JoinScreen />}
      {screen === 'lobby' && <Lobby room={room} onGameStart={handleGameStart} />}
      {screen === 'game' && (
        <GameBoard initialRoom={room} onGameEnd={handleGameEnd} />
      )}
      {room && <Chat />}
    </div>
  );
}