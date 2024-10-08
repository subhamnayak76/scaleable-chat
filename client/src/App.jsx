import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [activeServer, setActiveServer] = useState('3001');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
  
    const newSocket = io(`http://localhost:${activeServer}`);
    
    newSocket.on('connect', () => {
      console.log('Connected to server:', activeServer);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [activeServer]);

  const handleServerChange = (port) => {
    setActiveServer(port);
    setMessages([]); // Clear messages when switching servers
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (room && socket) {
      socket.emit('join_room', room);
      console.log('Joined room:', room);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && room && socket) {
      socket.emit('send_message', { room, message });
      setMessage('');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Select Server</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleServerChange('3001')}
            className={`px-4 py-2 rounded ${
              activeServer === '3001' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Server 3001
          </button>
          <button
            onClick={() => handleServerChange('3002')}
            className={`px-4 py-2 rounded ${
              activeServer === '3002' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Server 3002
          </button>
        </div>
        <p className="text-sm mt-2">
          Status: {connected ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      <div className="mb-4">
        <form onSubmit={joinRoom} className="flex gap-2">
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button 
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Join
          </button>
        </form>
      </div>

      <div className="mb-4 border rounded-lg p-4 h-80 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${msg.sender === socket?.id ? 'text-right' : 'text-left'}`}
          >
            <span className={`inline-block px-3 py-2 rounded-lg ${
              msg.sender === socket?.id ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {msg.msg}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;