const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// --- 关键：适配 Zeabur 环境变量 ---
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL; // Zeabur 中设置的环境变量

if (!MONGO_URL) {
    console.error("❌ 错误: 未检测到环境变量 MONGO_URL");
}

mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Zeabur 数据库连接成功"))
  .catch(err => console.error("❌ 数据库连接失败:", err));

// 数据模型
const Category = mongoose.model('Category', new mongoose.Schema({
    name: String, level: Number, parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}));
const Location = mongoose.model('Location', new mongoose.Schema({ name: String }));
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, cat1: String, cat2: String, imageUrl: String,
    quantity: Number, spec: String, locations: [String], notes: String,
    createdAt: { type: Date, default: Date.now }
}));

// API 路由
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
    await Location.findByIdAndDelete(req.params.id); res.json({ success: true });
});

app.get('/api/items', async (req, res) => res.json(await Item.find().sort({ createdAt: -1 })));
app.post('/api/items', async (req, res) => res.json(await new Item(req.body).save()));
app.put('/api/items/:id', async (req, res) => {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updated);
});
app.delete('/api/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id); res.json({ success: true });
});

// 监听 0.0.0.0 确保外网可访问
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 服务已在端口 ${PORT} 启动`);
});