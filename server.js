const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// بڑی تصویروں کے لیے سائز لیمٹ
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// عارضی طور پر پچھلی 50 تصویریں سرور کی میموری میں محفوظ رکھنے کے لیے
let backupGallery = []; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ویب پینل جب پیج ریفریش کرے تو پرانی تصویریں منگوانے کے لیے
app.get('/api/get-gallery', (req, res) => {
    res.json(backupGallery);
});

// --- ایپ یہاں سے تصویریں بھیجے گی ---
app.post('/api/upload', (req, res) => {
    const { folderName, fileName, fileData } = req.body;
    
    console.log(`✅ [UPLOADED] ${folderName} -> ${fileName}`);

    const newImage = { folderName, fileName, fileData };

    // میموری میں تصویر سیو کریں (صرف آخری 50 تصویریں تاکہ سرور کریش نہ ہو)
    backupGallery.unshift(newImage);
    if (backupGallery.length > 50) backupGallery.pop();

    // ویب پینل کو لائیو سگنل بھیجیں کہ نئی تصویر آ گئی ہے
    io.emit('new_backup_image', newImage);

    res.status(200).send({ success: true, message: 'File received' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backup API & Socket Server running on port ${PORT}`));
