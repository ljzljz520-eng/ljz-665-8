# 仓库叉车档案页

低代码平台（若依/RuoYi 风格）下的叉车档案管理页：列表按仓区筛选，导出仅导当前查询结果。

## 目录结构

```
src/
├── api/warehouse/forklift.js          # 接口定义
└── views/warehouse/forklift/index.vue # 档案页（查询 + 表格 + 弹窗 + 导出）
sql/
└── warehouse_forklift.sql             # 建表 + 平台菜单 + 字典 初始化脚本
```

## 默认命名规范（生成代码统一遵守）

### 1. 业务实体

| 项 | 命名 | 说明 |
|---|---|---|
| 中文名 | 仓库叉车档案 | |
| 英文标识 | `forklift` | 全局统一前缀，不混用 truck / forkTruck |
| 模块分组 | `warehouse` | 路由、API、权限的统一上级 |

### 2. 字段命名（前端 camelCase ↔ 数据库 snake_case）

| 中文 | 前端/JS | 数据库列 | 说明 |
|---|---|---|---|
| 主键 | `forkliftId` | `forklift_id` | |
| 叉车编号 | `forkliftNo` | `forklift_no` | 唯一约束 |
| 型号 | `model` | `model` | |
| 仓区 | `warehouseZone` | `warehouse_zone` | 字典 `warehouse_zone` |
| 司机 | `driverName` | `driver_name` | |
| 年检日期 | `annualInspectionDate` | `annual_inspection_date` | `yyyy-MM-dd` |
| 维修状态 | `maintenanceStatus` | `maintenance_status` | 字典 `forklift_maintenance_status`（0正常/1维修中/2停用） |
| 备注 | `remark` | `remark` | |

### 3. 文件 / 路由 / 组件

| 项 | 命名 |
|---|---|
| 页面文件 | `src/views/warehouse/forklift/index.vue` |
| API 文件 | `src/api/warehouse/forklift.js` |
| 路由路径 | `/warehouse/forklift`（挂在"仓储管理"目录下） |
| 组件 name | `WarehouseForklift` |
| 业务表 | `wms_forklift` |

### 4. API 方法 / 接口地址

| 方法 | 地址 | 用途 |
|---|---|---|
| `listForklift` | `GET /warehouse/forklift/list` | 分页查询（携带仓区等筛选条件） |
| `getForklift` | `GET /warehouse/forklift/{forkliftId}` | 详情 |
| `addForklift` | `POST /warehouse/forklift` | 新增 |
| `updateForklift` | `PUT /warehouse/forklift` | 修改 |
| `delForklift` | `DELETE /warehouse/forklift/{forkliftIds}` | 删除 |
| （导出） | `POST /warehouse/forklift/export` | 导出，见下 |

### 5. 权限标识（菜单按钮 perms）

```
warehouse:forklift:list / query / add / edit / remove / export
```

### 6. 页面内变量 / 方法

| 类别 | 命名 |
|---|---|
| 列表数据 | `forkliftList` |
| 查询参数 | `queryParams`（`pageNum` / `pageSize` / `forkliftNo` / `warehouseZone` / `maintenanceStatus`） |
| 表单对象 | `form`；弹窗开关 `open`；弹窗标题 `title` |
| 方法 | `getList` / `handleQuery` / `resetQuery` / `handleAdd` / `handleUpdate` / `submitForm` / `handleDelete` / `handleExport` |

## 关键行为说明

- **仓区筛选**：查询区 `warehouseZone` 下拉（字典 `warehouse_zone`），随 `queryParams` 提交到 `/list`。
- **导出只导当前查询结果**：`handleExport` 将当前 `queryParams`（含仓区、编号、维修状态、分页参数）原样带到导出接口，后端按相同条件查询导出，**不导全表**：

  ```js
  this.download('warehouse/forklift/export', { ...this.queryParams }, `forklift_${...}.xlsx`)
  ```

## 平台依赖（低代码平台全局能力）

`@/utils/request`、`this.download`、`this.$modal`、`this.resetForm`、`<dict-tag>`、`<pagination>`、`<right-toolbar>`、`v-hasPermi`、`dicts` 字典注入。部署到非若依系平台时，按平台等价物替换即可，命名无需变动。

## 部署步骤

1. 执行 `sql/warehouse_forklift.sql`（先改 `@parentMenuId` 为平台"仓储管理"目录的 menu_id）。
2. 将 `src/` 下两个文件拷入前端工程对应目录。
3. 在低代码平台菜单管理中确认"叉车档案"菜单已出现，给角色勾选菜单与按钮权限。
