import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    function onNewMessage(msg) {
      setMessages((prev) => [...prev, msg]);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    }

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // 3. Open/Close chat drawer
  function toggleChat() {
    if (!isOpen) {
      setUnreadCount(0); 
    }
    setIsOpen(!isOpen);
  }

  function handleSendMessage(e) {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit('send_message', { text: inputText.trim() });
    setInputText('');
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>💬 Game Chat</span>
            <button className="chat-close-btn" onClick={toggleChat}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="chat-empty">No messages yet. Say hello!</p>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === socket.id;
                return (
                  <div key={m.id} className={`chat-bubble ${isMe ? 'chat-me' : 'chat-other'}`}>
                    <div className="chat-meta">
                      <span className="chat-sender">{isMe ? 'You' : m.sender}</span>
                      <span className="chat-time">{m.time}</span>
                    </div>
                    <div className="chat-text">{m.text}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={150}
              autoFocus
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}

      <button className="chat-toggle-btn" onClick={toggleChat}>
        💬 Chat
        {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
      </button>
    </div>
  );
}