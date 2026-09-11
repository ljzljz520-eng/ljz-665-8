# 仓库叉车档案页

部署在低代码平台「仓库管理」菜单下的叉车档案管理页面。

## 功能

- 档案字段：叉车编号、型号、仓区、司机、年检日期、维修状态、备注
- 列表支持按 **仓区** 筛选（同时支持维修状态、关键字）
- **导出只导当前查询结果**（导出接口与列表共用同一套筛选逻辑）
- 新增 / 编辑 / 删除
- **数据 JSON 文件持久化**：增删改实时落盘，服务重启不丢失

## 快速开始

```bash
npm install
npm start
# 页面入口: http://localhost:3000/web/forklift-archive/
```

- 数据文件默认 `server/data/forklifts.json`，首次启动自动写入 7 条示例数据；
  可用环境变量 `FORKLIFT_DB_FILE` 指定路径，**删除该文件后重启可恢复初始示例数据**。
- 平台 iframe 只能访问本服务的对外地址，本机 `localhost` 地址仅用于本地调试。

## 目录结构

```
server/index.js                   # 后端 API（Express）
server/store.js                   # JSON 文件持久化存储（重启不丢数据）
server/data/forklifts.json        # 运行期数据文件（不入库，首次启动自动生成）
web/forklift-archive/index.html   # 页面（Vue3 + Element Plus，单文件，便于 iframe 嵌入）
lowcode/menu.config.json          # 低代码平台菜单注册配置（模板，iframeUrl 为相对路径）
lowcode/deploy.js                 # 发布脚本：注册菜单 + 挂载探活 + 生成发布回执
lowcode/deploy-receipt.example.json # 发布回执样例（真实回执 deploy-receipt.json 不入库）
.env.example                      # 发布/运行所需环境变量模板
docs/NAMING.md                    # 生成代码默认命名规范
```

## 低代码平台部署

> ⚠️ 仅把 `lowcode/menu.config.json` 放进仓库**不等于菜单已上线**：配置中的
> `iframeUrl` 是相对路径，且没有任何平台实例记录。菜单要能在平台里点开，必须
> 执行下面的发布动作，拿到**发布回执 + 挂载探活通过**才算交付完成。

### 方式一：脚本发布（推荐，可重复执行）

```bash
cp .env.example .env        # 填入平台地址、API Token、本服务对外地址
npm run deploy              # 注册菜单 → 探活已挂载页面 → 生成回执
npm run deploy:dry-run      # 不调平台，先预览将发送的请求和绝对地址
```

脚本执行内容：

1. 读取 `lowcode/menu.config.json`，将 `route.iframeUrl` / `route.component`
   渲染为基于 `FORKLIFT_PUBLIC_URL` 的**绝对地址**（平台 iframe 无法使用相对路径）；
2. 调用平台菜单接口 `POST {LOWCODE_PLATFORM_URL}/api/open/menus`
   （携带 `Authorization: Bearer <token>`；菜单已存在时自动改为 PUT 更新）；
3. 对 `iframeUrl` 页面和列表 API 做 GET 探活，确认平台侧**已挂载页面可达**；
4. 生成 `lowcode/deploy-receipt.json`，记录平台地址、菜单ID、挂载地址、
   HTTP 状态、探活结果、发布时间与发布人（字段见 `deploy-receipt.example.json`）。

> 不同平台 OpenAPI 的路径/鉴权头可能不同，如不一致只需调整 `lowcode/deploy.js`
> 顶部的 `MENU_API` 路径与请求头，回执与探活流程保持不变。

### 方式二：平台手工导入

在平台菜单管理中导入 `menu.config.json`，并手工把菜单地址改成
`{本服务对外地址}/web/forklift-archive/`；保存后**必须实际打开菜单验证页面加载**，
并把平台菜单 ID、访问地址、验证结果补录到一份回执中归档。

### 发布后权限配置

按需为角色分配 `warehouse:forkliftArchive:*` 权限点（query/add/edit/delete/export）。
