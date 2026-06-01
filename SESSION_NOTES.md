# 项目笔记 / Session Notes — Xiao Ma 个人网站

最后更新：2026-05-31

---

## 1. 项目概况

Xiao Ma（马晓）的个人学术网站，纯 **HTML / CSS / JavaScript** 构建，无需任何框架或构建工具（没有 node_modules、没有打包步骤）。

设计风格：受 shopdoen.com 启发的编辑风 / 浪漫风格 —— 暖米色背景、淡紫色调、玫瑰色点缀，标题用衬线字体 Cormorant Garamond，正文用 Jost。字体通过 Google Fonts 在线引入。

---

## 2. 文件结构

| 文件 | 作用 |
|------|------|
| `index.html` | 首页（姓名、读音、简介、照片、CV/Email 按钮） |
| `research.html` | 研究页（三篇论文，含 Methods、Invited Presentations、脚注） |
| `experience.html` | 经历页（居住过的城市 + 照片画廊 gallery） |
| `creative.html` | 创意页（写作 / 摄影等，目前为占位内容） |
| `styles.css` | 全站统一样式（含配色变量 `:root`） |
| `script.js` | 移动端导航菜单的开关逻辑 |
| `profile.jpg` | 首页头像（来自哈佛官网） |
| `serve.py` | 本地预览服务器脚本（见下方运行方式） |
| `.claude/launch.json` | Claude Code 预览配置（可忽略） |

导航顺序：**Home · Research · Experience · Creative · CV**（这 5 个链接在每个 html 文件顶部都有一份，改导航要 4 个页面同步改）。

---

## 3. 如何运行（本地预览）

因为是纯静态站点，任选一种方式：

**方式 A — Python（最简单，Mac 自带 Python3）：**
```bash
cd 项目目录
python3 -m http.server 3456
```
然后浏览器打开 http://localhost:3456/index.html

**方式 B — 直接双击：**
直接用浏览器打开 `index.html` 也能看，但部分浏览器对本地文件加载字体/图片可能略有差异，推荐用方式 A。

---

## 4. 当前完成状态

- ✅ **首页**：内容全部完成（姓名、读音 "shell-ma"、SJD 头衔、两段简介、头像、按钮）
- ✅ **研究页**：三篇论文全部完成 —— 摘要、Methods、Invited Presentations、脚注（`*` 表示因日程冲突未能出席）
- ✅ **经历页**：10 个城市的双栏布局已搭好；**Hangzhou 和 Beijing 的 caption 已填写**，其余 8 个仍是占位文字
- ✅ **创意页**：页面框架和样式已完成，**内容为占位**（Essay / Poetry / Photography 三个示例）
- ✅ **整体设计**：暖米色 + 淡紫配色、衬线标题、玫瑰色点缀均已应用

---

## 5. 下一步要做的事（TODO）

1. **经历页城市 caption** —— 补全剩余 8 个城市：Oxford、London、Shanghai、Hong Kong、Boston、New Haven、Washington D.C.、Dallas
2. **经历页照片画廊** —— 目前是淡紫色占位方块。把照片放进项目文件夹（命名如 `photo1.jpg`…），再把 `experience.html` 里 `.gallery-placeholder` 的 `<div>` 换成 `<img src="photo1.jpg" alt="说明">`
3. **创意页内容** —— 用真实的写作 / 摄影作品替换占位内容
4. **CV 文件** —— 把简历存为 `cv.pdf` 放进项目根目录（首页和导航的 "CV"、"Download CV" 已经指向 `cv.pdf`，放进去即可生效）
5. **上线部署** —— 推荐 Netlify（免费，把整个文件夹拖进去即可）或 GitHub Pages；之后可绑定自定义域名

---

## 6. 小提示

- 改配色：编辑 `styles.css` 顶部 `:root` 里的 CSS 变量（`--bg`、`--accent`、`--rose` 等），全站会统一更新
- 改导航：4 个 html 文件顶部的 `<ul class="nav-links">` 都要同步改
- 城市 caption 在 `experience.html` 的 `.city-caption` 里；研究内容在 `research.html` 的 `.paper` 区块里
