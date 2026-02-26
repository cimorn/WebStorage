# 📦 WebStorage - 云端极简物资管理系统

### 项目简介

**WebStorage** 是一款专为个人及家庭打造的云端物资可视化管理工具。它通过最直观的层级结构，解决了“东西在哪”和“有多少”的核心痛点。

**核心特点总结：**

* **直观**：三级位置，一眼定位。
* **丝滑**：树状折叠，管理不乱。
* **严谨**：重名校验，逻辑严密。
* **高效**：快速登记，即时反馈。

---

## 📂 项目结构与文件功能

### 目录树预览

```text
/WebStorage
├── /public                # 静态资源目录（前端）
│    ├── index.html        # 单页应用入口
│    ├── /css              # 样式模块化文件夹
│    │    ├── config.css   # 【核心】一二级分类管理与位置配置界面样式
│    │    ├── goods.css    # 【核心】物件网格展示、新增/编辑表单及遮罩样式
│    │    ├── main.css     # 【框架】全局变量、基础布局、Header及Modal通用样式
│    │    └── navigation.css # 【交互】侧边栏分类及顶部标签栏样式
│    └── /js               # 逻辑模块化文件夹
│         ├── config.js    # 【管理】分类/位置的配置逻辑、树形列表渲染
│         ├── goods.js     # 【物件】物品渲染、图片上传、增删改查逻辑
│         ├── main.js      # 【全局】数据初始化、弹窗控制、编辑模式切换
│         └── navigation.js # 【导航】分类切换与数据过滤逻辑
├── server.js              # Node.js 后端服务 (Express + MongoDB + OSS)
├── package.json           # 项目依赖与启动配置
└── README.md              # 项目说明文档

```

### 文件详细说明

#### 1. 前端样式 (public/css/)

* **config.css**: 专门负责管理后台中“一二级分类”和“位置管理”相关的 UI，包含树形折叠图标和管理列表项。
* **goods.css**: 负责物品网格（Grid）布局、卡片（Card）外观，以及点击“编辑”后出现的半透明操作遮罩。
* **main.css**: 整个系统的根基，包含配色方案（CSS Variables）、整体页面骨架、以及通用的弹窗、按钮和输入框样式。
* **navigation.css**: 处理侧边主导航和顶部二级分类标签的响应式切换。

#### 2. 前端逻辑 (public/js/)

* **config.js**: 包含分类管理和位置管理的全部 JS 逻辑，如 `renderCatList`（渲染分类树）和 `handleAddLocation`（位置去重添加）。
* **goods.js**: 负责核心业务，如 `renderGrid`（渲染物品）、图片重命名上传逻辑以及物品数据的提交更新。
* **main.js**: 作为主入口，负责 `window.onload` 后的数据拉取（refreshAll）和管理模式开关。
* **navigation.js**: 纯粹处理导航交互，点击分类时触发数据筛选。

---

## 💻 本地预览步骤

1. **环境准备**：安装 [Node.js](https://nodejs.org/)，并确保拥有 **MongoDB** 地址及 **阿里云 OSS** 账号。
2. **安装依赖**：
```bash
npm install

```


3. **配置环境**：在本地创建 `.env` 或在 `server.js` 中填入你的 `MONGO_URL`、`OSS_REGION`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 和 `OSS_BUCKET`。
4. **启动服务**：
```bash
node server.js

```


5. **访问地址**：打开浏览器访问 `http://localhost:3000`。

---

## 🚀 在 Zeabur 上的部署操作

### 第一步：代码提交

1. 确保你的项目根目录下有 `server.js` 和 `package.json`。
2. 将整个文件夹（含 `public`）推送到你的 GitHub 仓库。

### 第二步：创建服务

1. 登录 [Zeabur](https://zeabur.com/)，点击 **Create Project**。
2. 选择 **Deploy service**，连接 GitHub 并选择你的仓库。Zeabur 会自动识别 Node.js 环境并开始构建。

### 第三步：配置环境变量 (关键)

在 Zeabur 服务的 **Configs** 页面，点击 **Variables**，手动添加以下变量：

* `OSS_REGION`：阿里云 OSS 区域（如 `oss-cn-hangzhou`）。
* `OSS_ACCESS_KEY_ID`：阿里云 AccessKey ID。
* `OSS_ACCESS_KEY_SECRET`：阿里云 AccessKey Secret。
* `OSS_BUCKET`：你的 OSS Bucket 名称。

### 第四步：连接 MongoDB

1. 在同一项目中点击 **Prebuilt Service**，选择 **MongoDB** 部署。
2. 部署完成后，Zeabur 会自动在项目中提供一个 `MONGO_URL`。
3. **重要**：请进入你的 Node.js 服务设置，确保它能正确读取到 MongoDB 生成的连接变量。

---

## 🛠️ 需要配置的环境变量清单

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `MONGO_URL` | MongoDB 连接地址 | `mongodb://root:password@mongo:27017` |
| `OSS_REGION` | 阿里云 OSS 区域 | `oss-cn-hangzhou` |
| `OSS_ACCESS_KEY_ID` | 阿里云访问密钥 ID | `LTAI5t...` |
| `OSS_ACCESS_KEY_SECRET` | 阿里云访问密钥 Secret | `mU6Y2...` |
| `OSS_BUCKET` | 阿里云 OSS 存储桶名称 | `your-bucket-name` |
