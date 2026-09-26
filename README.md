# 叉车档案页

仓库叉车档案管理页面，作为**自定义页面部署在低代码平台菜单下**（Vue 3 + Element Plus，CDN 引入、零构建，单页可直接托管）。

## 功能

- 档案列表：叉车编号、型号、仓区、司机、年检日期、维修状态、备注
- 按**仓区**筛选（下拉字典），支持编号 / 司机关键字模糊查询
- **导出只导当前查询结果**：导出按钮直接使用当前查询返回的全量数据生成 CSV（UTF-8 带 BOM），工具栏实时显示当前筛选条件便于导出前确认
- 年检日期自动标记「已过期 / 临期（30 天内）」
- 前端分页（查询结果一次返回，翻页不重复请求）

## 目录结构

```
├── index.html        # 页面入口（模板 + 样式）
├── src/
│   ├── api.js        # 数据接口层：字典、mock 数据、接口、CSV 导出
│   └── page.js       # 页面逻辑（Vue 组件）
├── mock-server.js    # 本地联调服务（零依赖，含示例接口）
├── docs/naming.md    # 默认命名整理（菜单/字段/字典/接口/CSS 等）
└── package.json
```

## 本地运行

```bash
npm start          # 或 node mock-server.js
# 打开 http://localhost:8080
```

> 页面依赖 unpkg CDN 的 Vue / Element Plus；内网部署时把这两个文件下载到本地，替换 index.html 中的引用即可。

## 部署到低代码平台

1. 将 `index.html`、`src/` 发布到静态资源目录，得到页面地址，如 `/forklift-archive/index.html`。
2. 在低代码平台「菜单管理」新增菜单，按 [docs/naming.md](docs/naming.md) 第 1 节填写：
   - 菜单名称：`叉车档案`，菜单编码：`warehouse_forklift_archive`
   - 路由地址：`/lowcode/warehouse/forklift-archive`
   - 页面类型：自定义页面 / 外链页面，页面地址填上一步的 URL
3. 接真实后端：改 `src/api.js` 顶部 `USE_MOCK = false`、`API_BASE = 后端地址`。

## 接口契约

| 功能 | 方法 | 路径 | 参数 | 返回 |
| --- | --- | --- | --- | --- |
| 列表 | GET | `/api/warehouse/forklifts` | `warehouseZone`、`keyword`（均可空） | `{ code: 0, data: { list: [...], total } }` |
| 导出 | GET | `/api/warehouse/forklifts/export` | 同列表 | CSV 文件流，**只含当前查询结果** |

记录字段：`forkliftNo`、`model`、`warehouseZone`、`driver`、`annualInspectionDate`、`maintenanceStatus`、`remark`（字典与取值见 docs/naming.md）。

> 当前导出在前端完成（数据源即当前查询结果）；数据量大时可切换为调用导出接口，参数与列表一致，后端按相同条件过滤即可。

## 命名规范

生成代码中所有默认命名（菜单编码、字段 key、字典编码、接口路径、方法名、CSS 类、导出文件名）统一整理在 **[docs/naming.md](docs/naming.md)**，改名时按文档第 9 节同步修改。
