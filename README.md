# 鱼秋设计个人工作站

这是一个静态单页面个人网站，适合直接部署到 GitHub Pages、Netlify、Vercel、Cloudflare Pages 或普通静态网站空间。

## 文件结构

- `index.html`：页面内容与结构
- `styles.css`：视觉样式与响应式布局
- `script.js`：动效与交互脚本
- `assets/wechat-qr.jpg`：微信二维码图片
- `.nojekyll`：让 GitHub Pages 直接按静态文件发布

## 本地预览

如果已经启动本地预览服务，可以打开：

`http://127.0.0.1:4217/personal-site/index.html`

## 上线方式

上传以下文件和文件夹即可：

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.nojekyll`

不要上传 `server.pid`、`screenshots/` 或其他本地测试文件。

## GitHub Pages 推荐设置

1. 新建一个 GitHub 仓库，例如 `yuqiu-design-site`
2. 上传本文件夹里的所有文件
3. 打开仓库 `Settings` -> `Pages`
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main`，Folder 选择 `/root`
6. 保存后等待 GitHub Pages 生成网址

## 上线前替换项

- 邮箱：`jinyan6181@qq.com`
- 微信二维码：`assets/wechat-qr.jpg`
- 小红书账号：当前为“新号筹备中”，注册后可替换为正式主页或账号名
- 作品项目：当前为样板内容，后续可替换成真实案例
