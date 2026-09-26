/**
 * 叉车档案 - 数据接口层
 * 命名约定见 docs/naming.md
 *
 * 默认使用内置 mock 数据；接入真实后端时：
 *   1. 把 USE_MOCK 改为 false
 *   2. 把 API_BASE 改为后端地址（同源部署可留空）
 */
(function (global) {
  'use strict';

  /* ---------------- 配置 ---------------- */
  var API_BASE = '';                 // 后端基础地址，例如 'https://api.example.com'
  var USE_MOCK = true;               // 联调完成后置为 false

  /* 接口路径 */
  var API_LIST = '/api/warehouse/forklifts';          // 列表查询 GET
  var API_EXPORT = '/api/warehouse/forklifts/export'; // 导出 GET（参数同列表，仅返回当前查询结果）

  /* ---------------- 字典 ---------------- */
  /** 仓区字典（字典编码：warehouse_zone） */
  var WAREHOUSE_ZONE_OPTIONS = [
    { value: 'A', label: 'A区' },
    { value: 'B', label: 'B区' },
    { value: 'C', label: 'C区' },
    { value: 'D', label: 'D区' }
  ];

  /** 维修状态字典（字典编码：forklift_maintenance_status） */
  var MAINTENANCE_STATUS_OPTIONS = [
    { value: 'normal',    label: '正常',   type: 'success' },
    { value: 'pending',   label: '待维修', type: 'warning' },
    { value: 'repairing', label: '维修中', type: 'danger' },
    { value: 'stopped',   label: '停用',   type: 'info' }
  ];

  /** 导出列定义（顺序即 CSV 列顺序） */
  var EXPORT_COLUMNS = [
    { key: 'forkliftNo',            title: '叉车编号' },
    { key: 'model',                 title: '型号' },
    { key: 'warehouseZone',         title: '仓区',   dict: 'zone' },
    { key: 'driver',                title: '司机' },
    { key: 'annualInspectionDate',  title: '年检日期' },
    { key: 'maintenanceStatus',     title: '维修状态', dict: 'status' },
    { key: 'remark',                title: '备注' }
  ];

  /* ---------------- mock 数据 ---------------- */
  var MOCK_LIST = buildMockList();

  function buildMockList() {
    var zones = ['A', 'B', 'C', 'D'];
    var models = ['CPD30-AC4', 'CPD20-HB3', 'CPCD50-XC', 'CPD15-GE2', 'CQD16-EC2'];
    var drivers = ['张伟', '王强', '李军', '刘洋', '陈杰', '赵磊', '孙浩', '周斌'];
    var statuses = ['normal', 'normal', 'normal', 'pending', 'repairing', 'stopped'];
    var remarks = ['', '', '夜班专用', '冷库作业，注意防滑', '待更换轮胎', '新购置', ''];
    var list = [];
    for (var i = 1; i <= 28; i++) {
      var month = ((i * 7) % 12) + 1;
      var day = ((i * 11) % 27) + 1;
      var year;
      if (month <= 9) year = 2026;                       // 已过期
      else if (month === 10) year = 2026;                // 临期（<= 10/26）
      else year = (i % 2 === 0) ? 2026 : 2027;           // 正常
      if (i % 5 === 0) year = 2025;                      // 一部分早已过期
      list.push({
        forkliftNo: 'FC-' + ('000' + i).slice(-4),
        model: models[(i - 1) % models.length],
        warehouseZone: zones[(i - 1) % zones.length],
        driver: drivers[(i - 1) % drivers.length],
        annualInspectionDate: year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2),
        maintenanceStatus: statuses[(i - 1) % statuses.length],
        remark: remarks[(i - 1) % remarks.length]
      });
    }
    return list;
  }

  /* ---------------- 工具函数 ---------------- */
  function zoneLabel(value) {
    var hit = WAREHOUSE_ZONE_OPTIONS.filter(function (o) { return o.value === value; })[0];
    return hit ? hit.label : (value || '-');
  }

  function statusMeta(value) {
    var hit = MAINTENANCE_STATUS_OPTIONS.filter(function (o) { return o.value === value; })[0];
    return hit ? { label: hit.label, type: hit.type } : { label: value || '-', type: 'info' };
  }

  /** 按查询条件过滤（mock 与 mock-server 共用，保证前后端口径一致） */
  function filterMockList(params) {
    var zone = ((params && params.warehouseZone) || '').trim();
    var kw = ((params && params.keyword) || '').trim().toLowerCase();
    return MOCK_LIST.filter(function (row) {
      if (zone && row.warehouseZone !== zone) return false;
      if (kw && row.forkliftNo.toLowerCase().indexOf(kw) < 0 &&
                row.driver.toLowerCase().indexOf(kw) < 0) return false;
      return true;
    });
  }

  function csvCell(v) {
    var s = (v === null || v === undefined) ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /** 生成 CSV 文本（带 BOM，Excel 打开中文不乱码） */
  function buildForkliftCsv(rows) {
    var header = EXPORT_COLUMNS.map(function (c) { return c.title; }).join(',');
    var lines = rows.map(function (row) {
      return EXPORT_COLUMNS.map(function (c) {
        var v = row[c.key];
        if (c.dict === 'zone') v = zoneLabel(v);
        if (c.dict === 'status') v = statusMeta(v).label;
        return csvCell(v);
      }).join(',');
    });
    return '﻿' + header + '\r\n' + lines.join('\r\n') + '\r\n';
  }

  /** 浏览器端触发下载 */
  function downloadCsv(csvText, filename) {
    var blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------------- 接口 ---------------- */
  /**
   * 查询叉车列表
   * @param {{warehouseZone?: string, keyword?: string}} params
   * @returns Promise<{list: Array, total: number}> 返回当前查询条件的全部结果
   */
  function fetchForkliftList(params) {
    params = params || {};
    if (USE_MOCK) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var list = filterMockList(params);
          resolve({ list: list, total: list.length });
        }, 200);
      });
    }
    var qs = new URLSearchParams();
    if (params.warehouseZone) qs.set('warehouseZone', params.warehouseZone);
    if (params.keyword) qs.set('keyword', params.keyword);
    return fetch(API_BASE + API_LIST + '?' + qs.toString())
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body.code !== 0) throw new Error(body.message || '接口返回异常');
        return body.data; // { list, total }
      });
  }

  /* ---------------- 导出 ---------------- */
  var ForkliftApi = {
    API_LIST: API_LIST,
    API_EXPORT: API_EXPORT,
    WAREHOUSE_ZONE_OPTIONS: WAREHOUSE_ZONE_OPTIONS,
    MAINTENANCE_STATUS_OPTIONS: MAINTENANCE_STATUS_OPTIONS,
    EXPORT_COLUMNS: EXPORT_COLUMNS,
    MOCK_LIST: MOCK_LIST,
    zoneLabel: zoneLabel,
    statusMeta: statusMeta,
    filterMockList: filterMockList,
    buildForkliftCsv: buildForkliftCsv,
    downloadCsv: downloadCsv,
    fetchForkliftList: fetchForkliftList
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForkliftApi; // 供 mock-server.js 复用
  }
  global.ForkliftApi = ForkliftApi;
})(typeof window !== 'undefined' ? window : globalThis);
