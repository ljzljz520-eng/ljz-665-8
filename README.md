# 仓库叉车档案页

部署在低代码平台「仓库管理」菜单下的叉车档案管理页面。

## 功能

- 档案字段：叉车编号、型号、仓区、司机、年检日期、维修状态、备注
- 列表支持按 **仓区** 筛选（同时支持维修状态、关键字）
- **导出只导当前查询结果**（导出接口与列表共用同一套筛选逻辑）
- 新增 / 编辑 / 删除

## 快速开始

```bash
npm install
npm start
# 页面入口: http://localhost:3000/web/forklift-archive/
```

## 目录结构

```
server/index.js                  # 后端 API（Express，内存数据）
web/forklift-archive/index.html  # 页面（Vue3 + Element Plus，单文件，便于低代码平台嵌入）
lowcode/menu.config.json         # 低代码平台菜单注册配置
docs/NAMING.md                   # 生成代码默认命名规范
```

## 低代码平台部署

1. 将 `lowcode/menu.config.json` 导入平台菜单管理（或按该配置手工新建菜单）；
2. 菜单地址指向 `/web/forklift-archive/`（iframe 嵌入）或路由 `/warehouse/forklift-archive`；
3. 按需为角色分配 `warehouse:forkliftArchive:*` 权限点。
