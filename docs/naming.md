# 叉车档案页 - 默认命名整理

> 本文档汇总生成代码中使用的全部默认命名，作为低代码平台配置、接口对接和二次开发的统一口径。
> 如需改名，请按各表"出现位置"列同步修改。

## 1. 页面与菜单（低代码平台配置项）

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 菜单名称 | `叉车档案` | 平台菜单树中显示的名称 |
| 菜单编码 menuCode | `warehouse_forklift_archive` | 平台内唯一编码 |
| 页面编码 pageCode | `forklift_archive` | 自定义页面标识 |
| 路由地址 path | `/lowcode/warehouse/forklift-archive` | 平台路由，挂在"低代码平台/仓库管理"目录下 |
| 页面地址 url | `/forklift-archive/index.html` | 自定义页面实际部署地址（静态文件） |
| 组件名 | `ForkliftArchivePage` | 前端组件命名（页面根实例） |
| 浏览器标题 | `叉车档案` | index.html 的 `<title>` |

## 2. 数据字段（表单 / 表格列 / 接口字段统一使用）

| 中文名 | 字段 key（camelCase） | 类型 | 格式 / 字典 | 出现位置 |
| --- | --- | --- | --- | --- |
| 叉车编号 | `forkliftNo` | string | 规则 `FC-0001` | 表格列、CSV、接口 |
| 型号 | `model` | string | - | 同上 |
| 仓区 | `warehouseZone` | string | 字典 `warehouse_zone` | 查询条件、表格列、CSV、接口 |
| 司机 | `driver` | string | - | 同上 |
| 年检日期 | `annualInspectionDate` | date | `YYYY-MM-DD` | 表格列、CSV、接口 |
| 维修状态 | `maintenanceStatus` | string | 字典 `forklift_maintenance_status` | 表格列、CSV、接口 |
| 备注 | `remark` | string | - | 表格列、CSV、接口 |

## 3. 字典编码与取值

### 3.1 仓区字典 `warehouse_zone`

| value | label |
| --- | --- |
| `A` | A区 |
| `B` | B区 |
| `C` | C区 |
| `D` | D区 |

### 3.2 维修状态字典 `forklift_maintenance_status`

| value | label | 标签颜色（Element Plus tag type） |
| --- | --- | --- |
| `normal` | 正常 | success |
| `pending` | 待维修 | warning |
| `repairing` | 维修中 | danger |
| `stopped` | 停用 | info |

> 字典定义集中在 `src/api.js` 的 `WAREHOUSE_ZONE_OPTIONS` / `MAINTENANCE_STATUS_OPTIONS`，
> 平台侧如有字典管理服务，编码保持一致即可。

## 4. 查询参数（GET query string）

| 参数名 | 必填 | 说明 |
| --- | --- | --- |
| `warehouseZone` | 否 | 仓区字典值，空为全部 |
| `keyword` | 否 | 关键字，模糊匹配叉车编号 / 司机 |

## 5. 接口命名

| 功能 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 列表查询 | GET | `/api/warehouse/forklifts` | 返回 `{ code, data: { list, total } }` |
| 导出 | GET | `/api/warehouse/forklifts/export` | 查询参数同列表，**只返回当前查询结果**的 CSV |

> 路径常量定义在 `src/api.js`：`API_LIST` / `API_EXPORT`。

## 6. 前端方法 / 变量命名（src/page.js）

| 命名 | 用途 |
| --- | --- |
| `query` | 查询条件对象 `{ warehouseZone, keyword }` |
| `list` | 当前查询结果（全量，导出数据源） |
| `pagedList` | 当前页切片数据 |
| `pageNo` / `pageSize` | 分页参数 |
| `filterSummary` | 当前筛选条件摘要文本 |
| `fetchList()` | 查询列表 |
| `handleSearch()` / `handleReset()` | 查询 / 重置按钮事件 |
| `handleExport()` | 导出按钮事件（只导当前查询结果） |
| `handlePageChange()` / `handleSizeChange()` | 翻页 / 每页条数变更事件 |
| `rowIndex()` | 表格序号（跨页连续） |
| `inspectionTip()` | 年检日期提示（已过期 / 临期） |
| `zoneLabel()` / `statusMeta()` | 字典翻译（定义在 src/api.js） |

## 7. CSS 类命名（BEM，块名 `forklift-archive`）

| 类名 | 用途 |
| --- | --- |
| `.forklift-archive` | 页面根容器 |
| `.forklift-archive__query` | 查询区 |
| `.forklift-archive__toolbar` | 工具栏 |
| `.forklift-archive__summary` | 筛选条件摘要 |
| `.forklift-archive__pagination` | 分页条 |

## 8. 文件与导出文件命名

| 项 | 默认值 |
| --- | --- |
| 页面入口文件 | `index.html` |
| 页面逻辑 | `src/page.js` |
| 数据接口层 | `src/api.js` |
| 本地联调服务 | `mock-server.js` |
| 导出文件名 | `叉车档案_yyyyMMdd_HHmmss.csv`（如 `叉车档案_20260926_153000.csv`） |
| 导出编码 | UTF-8 带 BOM（Excel 打开中文不乱码） |

## 9. 改名指引

1. **改字段 key**：同步修改 `src/api.js` 的 `EXPORT_COLUMNS`、mock 数据、`index.html` 表格列 `prop`、后端接口字段。
2. **改接口路径**：只改 `src/api.js` 顶部 `API_LIST` / `API_EXPORT` 两个常量。
3. **改菜单 / 路由**：只改低代码平台菜单配置，代码无需变动。
4. **接真实后端**：`src/api.js` 中 `USE_MOCK = false`，并按需设置 `API_BASE`。
