/**
 * 仓库叉车档案 - 后端服务
 * 模块标识: forkliftArchive
 * 路由前缀: /api/warehouse/forklifts
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// 静态托管页面（低代码平台通过菜单链接到 /web/forklift-archive/）
app.use('/web', express.static(path.join(__dirname, '..', 'web')));

/* ---------------- 字典枚举（默认命名） ---------------- */
// 仓区 warehouseZone
const WAREHOUSE_ZONES = ['A区', 'B区', 'C区', 'D区'];
// 维修状态 maintenanceStatus
const MAINTENANCE_STATUS = {
  NORMAL: '正常',
  REPAIRING: '维修中',
  PENDING: '待维修',
  SCRAPPED: '报废',
};

/* ---------------- 模拟数据（内存存储） ---------------- */
let seq = 8;
let forkliftList = [
  { id: 1, forkliftNo: 'FL-001', model: '杭叉 CPCD30', warehouseZone: 'A区', driver: '张伟', annualInspectionDate: '2026-03-15', maintenanceStatus: 'NORMAL', remark: '电动叉车' },
  { id: 2, forkliftNo: 'FL-002', model: '合力 CPD20', warehouseZone: 'A区', driver: '李强', annualInspectionDate: '2025-11-20', maintenanceStatus: 'REPAIRING', remark: '更换电瓶中' },
  { id: 3, forkliftNo: 'FL-003', model: '丰田 8FD30', warehouseZone: 'B区', driver: '王磊', annualInspectionDate: '2026-06-01', maintenanceStatus: 'NORMAL', remark: '' },
  { id: 4, forkliftNo: 'FL-004', model: '杭叉 CPCD50', warehouseZone: 'B区', driver: '赵敏', annualInspectionDate: '2025-09-30', maintenanceStatus: 'PENDING', remark: '年检临期' },
  { id: 5, forkliftNo: 'FL-005', model: '林德 E16', warehouseZone: 'C区', driver: '陈杰', annualInspectionDate: '2026-01-12', maintenanceStatus: 'NORMAL', remark: '冷库专用' },
  { id: 6, forkliftNo: 'FL-006', model: '合力 CPD35', warehouseZone: 'C区', driver: '刘洋', annualInspectionDate: '2024-12-05', maintenanceStatus: 'SCRAPPED', remark: '已报废待处置' },
  { id: 7, forkliftNo: 'FL-007', model: '丰田 8FB20', warehouseZone: 'D区', driver: '孙丽', annualInspectionDate: '2026-08-22', maintenanceStatus: 'NORMAL', remark: '' },
];

/* ---------------- 查询过滤（列表与导出共用，保证导出=当前查询结果） ---------------- */
function filterForklifts(query) {
  const { warehouseZone, maintenanceStatus, keyword } = query;
  return forkliftList.filter((item) => {
    if (warehouseZone && item.warehouseZone !== warehouseZone) return false;
    if (maintenanceStatus && item.maintenanceStatus !== maintenanceStatus) return false;
    if (keyword) {
      const kw = String(keyword).trim().toLowerCase();
      const hit = [item.forkliftNo, item.model, item.driver]
        .some((f) => f && f.toLowerCase().includes(kw));
      if (!hit) return false;
    }
    return true;
  });
}

/* ---------------- 接口 ---------------- */
// 字典
app.get('/api/warehouse/forklifts/dicts', (req, res) => {
  res.json({ code: 0, data: { warehouseZones: WAREHOUSE_ZONES, maintenanceStatus: MAINTENANCE_STATUS } });
});

// 列表（分页 + 仓区筛选）
app.get('/api/warehouse/forklifts', (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(req.query.pageSize, 10) || 10, 1);
  const filtered = filterForklifts(req.query);
  const start = (page - 1) * pageSize;
  res.json({
    code: 0,
    data: { list: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize },
  });
});

// 导出（只导当前查询结果：复用同一套过滤条件，不分页）
app.get('/api/warehouse/forklifts/export', (req, res) => {
  const rows = filterForklifts(req.query);
  const header = ['叉车编号', '型号', '仓区', '司机', '年检日期', '维修状态', '备注'];
  const csvLines = [header.join(',')].concat(
    rows.map((r) =>
      [
        r.forkliftNo,
        r.model,
        r.warehouseZone,
        r.driver,
        r.annualInspectionDate,
        MAINTENANCE_STATUS[r.maintenanceStatus] || r.maintenanceStatus,
        r.remark || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
  );
  const csv = '﻿' + csvLines.join('\r\n'); // BOM 保证 Excel 打开中文不乱码
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="forklift-archive-${Date.now()}.csv"`);
  res.send(csv);
});

// 新增
app.post('/api/warehouse/forklifts', (req, res) => {
  const body = req.body || {};
  if (!body.forkliftNo) return res.status(400).json({ code: 400, message: '叉车编号不能为空' });
  const item = {
    id: ++seq,
    forkliftNo: body.forkliftNo,
    model: body.model || '',
    warehouseZone: body.warehouseZone || WAREHOUSE_ZONES[0],
    driver: body.driver || '',
    annualInspectionDate: body.annualInspectionDate || '',
    maintenanceStatus: body.maintenanceStatus || 'NORMAL',
    remark: body.remark || '',
  };
  forkliftList.push(item);
  res.json({ code: 0, data: item });
});

// 修改
app.put('/api/warehouse/forklifts/:id', (req, res) => {
  const item = forkliftList.find((f) => f.id === Number(req.params.id));
  if (!item) return res.status(404).json({ code: 404, message: '记录不存在' });
  Object.assign(item, req.body, { id: item.id });
  res.json({ code: 0, data: item });
});

// 删除
app.delete('/api/warehouse/forklifts/:id', (req, res) => {
  const idx = forkliftList.findIndex((f) => f.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ code: 404, message: '记录不存在' });
  forkliftList.splice(idx, 1);
  res.json({ code: 0, data: true });
});

app.listen(PORT, () => {
  console.log(`forklift-archive server listening on http://localhost:${PORT}`);
  console.log(`页面入口: http://localhost:${PORT}/web/forklift-archive/`);
});
