# Boo Float V3 技术交付

此项目是独立的 React + TypeScript + Three.js + Vite 前端。18 张预览全为真实幽灵，支持力度压扁、极限爆开、自动重组、亮暗环境和单手柄 Web Serial。

## 启动

Node.js 24，pnpm 11.19.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test:motion
pnpm test:appearance
pnpm build
```

默认开发地址见终端。构建后 dist/ 整个目录部署到域名根路径，配置 HTTPS；不需要后端、账号或 API Key。访问 / 与 /models/；motions/ 下有 18 个独立 HTML 入口。请通过 HTTP(S) 访问模块化网站；素材包的 HTML 则可以直接打开。

## 文件

- app/page.tsx：主页面、单动作页面、输入和导出按钮。
- lib/input-controller.ts：连续压力、阈值停留、爆开锁、释放、动作识别、数据解析。
- lib/motion.ts：18 个动作、统一元数据与时间曲线。
- lib/ghost-scene.ts：共享渲染、形变、分身、碎片、星屑和聚合。
- lib/reference-ghost.js：幽灵网格和硅胶材质。
- docs/ACTION-VISUAL-SPEC.md：全部触发参数、实际支持范围和单手柄协议。
- public/models/：可导入 3D 软件的静态 GLB。

手柄协议需要根据最终硬件联调，尚未实机验证。布尔按钮只能模拟满压力；要依据真实力度变化应提供 0–1 的模拟压力值。GLB 只含静态模型和材质，程序化动画需使用本包源码。
