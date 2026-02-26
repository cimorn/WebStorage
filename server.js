// 拦截并屏蔽特定的日志输出（在加载所有模块之前执行）
const originalLog = console.log;
console.log = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[dotenv@')) {
        return; 
    }
    originalLog(...args);
};
// 屏蔽 Node.js 引擎的弃用警告 (Punycode 警告)
process.removeAllListeners('warning');

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const OSS = require('ali-oss');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    secure: true
});

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const Category = mongoose.model('Category', new mongoose.Schema({
    name: String, level: Number, parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}));
const Location = mongoose.model('Location', new mongoose.Schema({
    name: String, level: Number, parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null }
}));
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, brand: String, cat1: String, cat2: String, imageUrl: String,
    quantity: String, spec: String, locations: [String], notes: String,
    createdAt: { type: Date, default: Date.now }
}));

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: '无文件' });
        const fileName = req.body.fileName;
        const ossPath = `storage/${fileName}`;
        await client.put(ossPath, req.file.buffer);
        res.json({ url: `https://file.mcj.life/${ossPath}` });
    } catch (err) { res.status(500).json({ error: '上传失败' }); }
});

app.get('/api/categories', async (req, res) => res.json(await Category.find()));
app.post('/api/categories', async (req, res) => res.json(await new Category(req.body).save()));
app.delete('/api/categories/:id', async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    await Category.deleteMany({ parentId: req.params.id });
    res.json({ success: true });
});

app.get('/api/locations', async (req, res) => res.json(await Location.find()));
app.post('/api/locations', async (req, res) => res.json(await new Location(req.body).save()));
app.delete('/api/locations/:id', async (req, res) => {
    const subLocs = await Location.find({ parentId: req.params.id });
    const subIds = subLocs.map(l => l._id);
    if(subIds.length > 0) await Location.deleteMany({ parentId: { $in: subIds } });
    await Location.deleteMany({ parentId: req.params.id });
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.get('/api/items', async (req, res) => res.json(await Item.find().sort({ createdAt: -1 })));
app.post('/api/items', async (req, res) => res.json(await new Item(req.body).save()));
app.put('/api/items/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body)));
app.delete('/api/items/:id', async (req, res) => res.json(await Item.findByIdAndDelete(req.params.id)));

app.listen(PORT, () => {
    console.log('\n---------------------------------------');
    console.log(`🚀 服务启动成功！`);
    console.log(`🔗 本地预览地址: http://localhost:${PORT}`);
    console.log('---------------------------------------\n');
});