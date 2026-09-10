# 仓库叉车档案页 —— 生成代码默认命名规范

## 1. 模块与页面

| 项 | 默认命名 | 说明 |
|---|---|---|
| 模块标识（camelCase） | `forkliftArchive` | 前端 app 根节点 `#forkliftArchiveApp`、样式前缀 `fa-` |
| 页面目录（kebab-case） | `web/forklift-archive/` | 静态页面目录 |
| 页面标题 | 仓库叉车档案 | `<title>` 与菜单名 |
| 菜单编码（snake_case） | `warehouse_forklift_archive` | 低代码平台菜单注册码 |
| 父菜单 | `warehouse_manage`（仓库管理） | 挂载位置 |
| 前端路由（kebab-case） | `/warehouse/forklift-archive` | 低代码平台路由 path |
| 权限标识 | `warehouse:forkliftArchive:<action>` | action: query/add/edit/delete/export |

## 2. 接口（REST，kebab-case 路径 + camelCase 参数）

| 用途 | 方法与路径 |
|---|---|
| 字典 | `GET /api/warehouse/forklifts/dicts` |
| 列表（分页+筛选） | `GET /api/warehouse/forklifts` |
| 导出（当前查询结果） | `GET /api/warehouse/forklifts/export` |
| 新增 | `POST /api/warehouse/forklifts` |
| 编辑 | `PUT /api/warehouse/forklifts/:id` |
| 删除 | `DELETE /api/warehouse/forklifts/:id` |

> 列表与导出共用同一套查询参数与 `filterForklifts()` 过滤逻辑，保证「导出 = 当前查询结果」。

## 3. 数据字段（camelCase）

| 中文字段 | 字段名 | 类型 | 说明 |
|---|---|---|---|
| 主键 | `id` | number | 自增 |
| 叉车编号 | `forkliftNo` | string | 必填，如 `FL-001` |
| 型号 | `model` | string | |
| 仓区 | `warehouseZone` | string | 枚举：A区/B区/C区/D区 |
| 司机 | `driver` | string | |
| 年检日期 | `annualInspectionDate` | string(YYYY-MM-DD) | |
| 维修状态 | `maintenanceStatus` | string | 枚举见下 |
| 备注 | `remark` | string | |

### 维修状态枚举（maintenanceStatus）

| 枚举值 | 中文 | 标签色 |
|---|---|---|
| `NORMAL` | 正常 | success |
| `REPAIRING` | 维修中 | danger |
| `PENDING` | 待维修 | warning |
| `SCRAPPED` | 报废 | info |

## 4. 前端变量/方法命名

| 类别 | 命名 | 示例 |
|---|---|---|
| 查询表单 | `queryForm` | 字段与后端查询参数同名：`warehouseZone`、`maintenanceStatus`、`keyword`、`page`、`pageSize` |
| 编辑表单 | `editForm` | 字段与数据字段同名 |
| 表格数据 | `tableData` / `total` / `loading` | |
| 事件方法 | `handleXxx` | `handleSearch`、`handleReset`、`handleExport`、`handleSave`、`handleDelete` |
| 数据方法 | `fetchXxx` / `buildXxx` | `fetchList`、`buildQuery` |
| 样式类前缀 | `fa-` | `fa-toolbar`、`fa-card`、`fa-pager` |

## 5. 导出文件

- 文件名：`forklift-archive-<时间戳>.csv`
- 编码：UTF-8 带 BOM（Excel 打开中文不乱码）
- 列顺序与表头：叉车编号、型号、仓区、司机、年检日期、维修状态、备注
