import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import { createClient } from "redis";

const app = express();
const server = createServer(app);

// Get port from command line argument
const port = process.argv[2] || 3001;

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Redis setup
const redisClient = createClient();
const subscriber = redisClient.duplicate();

// Connect to Redis
await redisClient.connect();
await subscriber.connect();

app.use(cors());

// Subscribe to Redis messages
subscriber.subscribe("CHAT_MESSAGES", (message) => {
    const { room, msg, sender, originalServer } = JSON.parse(message);
    
    // Only broadcast if message came from a different server
    if (originalServer !== port) {
        io.to(room).emit("receive_message", { msg, sender });
        console.log(`[Server ${port}] Broadcasting message from server ${originalServer}`);
    }
});

io.on("connection", (socket) => {
    console.log(`[Server ${port}] New client connected: ${socket.id}`);

    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`[Server ${port}] Client ${socket.id} joined room: ${room}`);
    });

    socket.on("send_message", async ({ room, message }) => {
        // Create message object
        const messageData = {
            room,
            msg: message,
            sender: socket.id,
            originalServer: port
        };

        // Publish to Redis for other servers
        await redisClient.publish("CHAT_MESSAGES", JSON.stringify(messageData));

        // Emit to clients on this server
        io.to(room).emit("receive_message", { msg: message, sender: socket.id });
        
        console.log(`[Server ${port}] Message sent in room ${room}`);
    });

    socket.on("disconnect", () => {
        console.log(`[Server ${port}] Client disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});