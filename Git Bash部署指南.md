# 初中数学交互动画 - Git Bash 部署指南

## 前提条件

1. **Git 已安装**：从截图中看到你已经成功安装了 Git 2.53.0
2. **Gitee 账号**：确保你已经注册了 Gitee 账号

## 部署步骤

### 1. 在 Git Bash 中初始化仓库

你已经打开了 Git Bash，并且当前目录是 `~/Desktop/初中数学交互动画`，这很好。

1. **初始化 Git 仓库**：
   ```bash
   git init
   ```

2. **配置 Git 用户名和邮箱**：
   ```bash
   git config user.name "你的名字"
   git config user.email "你的邮箱"
   ```

3. **查看当前文件状态**：
   ```bash
   git status
   ```

4. **添加所有文件**：
   ```bash
   git add .
   ```

5. **提交代码**：
   ```bash
   git commit -m "初始化项目"
   ```

### 2. 在 Gitee 上创建仓库

1. 打开浏览器，访问 [Gitee官网](https://gitee.com/)
2. 登录你的账号
3. 点击右上角的「+」按钮，选择「新建仓库」
4. 填写仓库信息：
   - 仓库名称：建议使用 `math-animations` 或其他有意义的名称
   - 仓库介绍：初中数学交互动画
   - 选择「公开」仓库
   - 不要勾选「使用 Readme 文件初始化仓库」（因为我们已经有本地仓库）
5. 点击「创建」按钮

### 3. 关联远程仓库并推送

1. 在 Gitee 仓库页面，复制仓库的 HTTPS 地址（类似于 `https://gitee.com/你的用户名/你的仓库名.git`）

2. 在 Git Bash 中添加远程仓库：
   ```bash
   git remote add origin https://gitee.com/你的用户名/你的仓库名.git
   ```
   （将 `你的用户名` 和 `你的仓库名` 替换为实际值）

3. 推送到 Gitee：
   ```bash
   git push -u origin master
   ```
   （如果默认分支是 `main`，请使用 `git push -u origin main`）

### 4. 配置 Gitee Pages

1. 进入 Gitee 仓库页面
2. 点击「服务」选项卡，选择「Gitee Pages」
3. 配置 Gitee Pages：
   - 部署分支：选择 `master` 或 `main`
   - 部署目录：留空（使用根目录）
   - 点击「启动」按钮
4. 等待部署完成，Gitee Pages 会生成一个访问地址

### 5. 访问网站

部署完成后，你可以通过 Gitee Pages 生成的地址访问你的网站，例如：
`https://你的用户名.gitee.io/你的仓库名`

## 后续维护

- 当你对项目进行修改后，在 Git Bash 中使用以下命令更新代码：
  ```bash
  git add .
  git commit -m "更新内容"
  git push
  ```
- Gitee Pages 会自动重新部署

## 常见问题

1. **推送代码失败**：
   - 检查网络连接
   - 确保 Gitee 账号有仓库权限
   - 检查远程仓库地址是否正确

2. **Gitee Pages 访问 404**：
   - 等待几分钟让部署完成
   - 检查部署配置是否正确
   - 确保根目录有 index.html 文件

3. **动画无法加载**：
   - 检查 GeoGebra 资源链接是否正确
   - 确保网络连接正常

## 技术说明

- 项目使用纯 HTML、CSS 和 JavaScript 开发
- 使用 GeoGebra 进行数学交互动画
- 网站结构清晰，易于维护和扩展
