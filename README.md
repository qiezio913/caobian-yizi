# 🌷 草编椅子

一个温暖的小网页应用：写日记 + 和 AI 风格的安慰机器人聊天。
因为表达能让人心情变好。

## 现在就能用

1. 直接双击打开 `index.html`（或用浏览器打开它）
2. 日记和聊天会先保存在浏览器本地

## 开启云端同步（Supabase）

1. 注册并登录 [Supabase](https://supabase.com)，新建一个项目
2. 打开项目的 **SQL Editor**，把 `supabase_setup.sql` 的内容粘贴进去并运行
3. 打开 **Project Settings → API**，复制：
   - Project URL
   - anon public key
4. 打开 `config.js`，填到对应位置：
   ```js
   window.SUPABASE_URL = "https://xxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
5. 刷新页面，右上角会显示「☁️ 云端同步已开启」

这样日记和聊天记录就会真正保存在云端，换电脑、换浏览器也能看。

## 文件说明

- `index.html` 主页面
- `style.css` 样式
- `app.js` 功能逻辑（日记、聊天、安慰机器人、云端/本地自动切换）
- `config.js` Supabase 配置
- `supabase_setup.sql` 建表语句
