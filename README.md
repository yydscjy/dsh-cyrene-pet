# dsh-cyrene-pet

> Cyrene 昔涟 Spine 桌宠插件 for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）

一个悬浮在 DSH Web 界面上的 Q 版昔涟桌宠（Spine 骨骼动画），实时反映会话状态：token 用量、权限/提问请求、思考/执行工具/报错等，并支持拖拽、缩放、镜像、自定义装饰组合。

## ✨ 功能

- **状态自动切换**：待机 / 思考 / 工作 / 请求权限 / 报错，播放速度 + 光环脉冲 + 粉色高亮
- **用量展示**：输入 / 输出 / 缓存读 / 缓存写 / 推理 tokens、当前模型、请求数（双击宠物或面板开关）
- **权限/提问应答**：授权请求与 `ask_user_question` 到达时宠物亮起，气泡内可直接点「允许一次 / 拒绝 / 选项」应答
- **自动眨眼**：使用模型自带的 `B闭眼` 槽位，约每 3~6 秒眨眼（可关）
- **自由操作**：拖拽移动、右下角拖拽缩放（50%–150%）、模型镜像、HUD 放左/右侧
- **装饰自由组合**：秋千 / 光点星星叶子带子 / 圣光光柱 / 光环 / 后裙摆，各自独立开关（默认隐藏撑大取景的场景道具，保留光环与后裙摆）
- **窗口式设置面板**：粉色悬浮窗，可拖标题栏移动、位置记忆

## 📦 安装（一键）

```sh
# 需要 pnpm 在 PATH 上（如未安装：npm i -g pnpm 或 corepack enable pnpm）
dsh plugin --profile web add @yydscjy/dsh-cyrene-pet
```

然后**重启 `dsh web`**，刷新页面，右下角出现桌宠。

> 包声明了 `dsh.bundle`，`dsh plugin add` 会自动把它加入 profile 的 bundles 并在启动时应用包内 `cordis.patch.yml`（注册 `cyrene-pet` 浏览器条目），无需手动改配置。

### 卸载

```sh
dsh plugin --profile web remove @yydscjy/dsh-cyrene-pet
```

重启 `dsh web` 即可。

## 🔨 本地开发 / 构建

```sh
# 构建依赖（一次）—— 无 pnpm 时也可用：
#   node C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js install --prefix runtime --cache .npm-cache --ignore-scripts --no-audit --no-fund rollup @rollup/plugin-node-resolve @esotericsoftware/spine-player@4.1.56

node scripts\build-client.mjs   # 产出 lib/client.js（rollup 打包，含 Spine 引擎）
node scripts\smoke-test.cjs     # 冒烟测试（可选）
node scripts\install.mjs        # 备选：手动复制进 $DSH_HOME profile（不发布时用）
```

## 📁 目录

```
├─ package.json          # dsh.bundle + dsh.client 双声明
├─ cordis.patch.yml      # bundle patch：注册 cyrene-pet 浏览器条目
├─ lib/
│  ├─ index.js           # node 端：/pet-assets 路由伺服模型
│  ├─ client.js          # 浏览器 bundle（构建产物）
│  └─ invariant.js
├─ src/client.js         # 浏览器端源码
├─ assets/               # 模型资源（Spine 4.1.24 Avatar）
└─ scripts/              # 构建/测试/安装/诊断脚本
```

## 🧩 模型说明

- 素材：`Q版昔涟`（Spine 4.1.24），仅使用 `_Avater` 骨架（角色本体 + 光环）
- 内置动画仅 `FadeIn`（入场）与 `Loop`（待机循环）；眨眼、表情由槽位切换合成
- 渲染引擎：[@esotericsoftware/spine-player](https://www.npmjs.com/package/@esotericsoftware/spine-player) 4.1.56（Spine Runtimes License，免费）
- 模型文件为解包素材，仅供个人学习使用；发布/分发时请自行确认素材授权

## 📤 发布

```sh
npm login
npm publish            # 需要 @yydscjy 作用域权限
```

## 🔖 License

MIT（模型素材版权归原作者所有）
