const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// بڑی تصویروں کے لیے سائز لیمٹ
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ==========================================
// 📦 MONGODB CONNECTION & SCHEMA
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('📦 MongoDB Connected Successfully!'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.log('⚠️ MONGODB_URI is not set in environment variables!');
}

const imageSchema = new mongoose.Schema({
    folderName: String,
    fileName: String,
    fileData: String,
    createdAt: { type: Date, default: Date.now }
});

const ImageModel = mongoose.model('Image', imageSchema);

// ==========================================
// 🚀 ROUTES
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ویب پینل کو ڈیٹا بیس سے آخری 50 تصویریں دینے کے لیے
app.get('/api/get-gallery', async (req, res) => {
    try {
        const images = await ImageModel.find().sort({ createdAt: -1 }).limit(50);
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ایپ یہاں تصویریں بھیجے گی جو سیدھی DB میں جائیں گی
app.post('/api/upload', async (req, res) => {
    try {
        const { folderName, fileName, fileData } = req.body;
        
        if (!fileName || !fileData) {
            return res.status(400).send({ error: 'Missing data' });
        }

        console.log(`⏳ [SAVING TO DB] ${folderName} -> ${fileName}`);

        // ڈیٹا بیس میں محفوظ کریں
        const newImage = new ImageModel({ folderName, fileName, fileData });
        await newImage.save();

        console.log(`✅ [UPLOAD SUCCESS] ${fileName}`);

        // ویب پینل کو لائیو سگنل بھیجیں تاکہ اسے پیج ریفریش نہ کرنا پڑے
        io.emit('new_backup_image', { folderName, fileName, fileData });

        res.status(200).send({ success: true, message: 'Saved to MongoDB' });
    } catch (error) {
        console.error('Upload Route Error:', error.message);
        res.status(500).send({ error: 'Server Error' });
    }
});

// ==========================================
// 🛡️ ERROR HANDLING (For Aborted Requests)
// ==========================================
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        console.log(`⚠️ [WARNING] File too large rejected.`);
        return res.status(413).send('Payload Too Large');
    }
    if (err.type === 'request.aborted') {
        console.log(`⚠️ [WARNING] Request aborted by Mobile App (Network Fluctuation).`);
        return res.status(400).send('Request aborted');
    }
    next(err);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));