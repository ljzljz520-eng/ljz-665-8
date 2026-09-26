/**
 * 本地联调服务（零依赖，仅用于开发调试）
 * - 静态托管 index.html / src/*
 * - 提供示例接口：
 *     GET /api/warehouse/forklifts          列表（支持 warehouseZone、keyword 查询参数）
 *     GET /api/warehouse/forklifts/export   导出（参数同上，仅返回当前查询结果的 CSV）
 * 启动：node mock-server.js  （默认端口 8080，可用 PORT 环境变量覆盖）
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const api = require('./src/api.js');

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

function queryParams(url) {
  return {
    warehouseZone: url.searchParams.get('warehouseZone') || '',
    keyword: url.searchParams.get('keyword') || ''
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // 列表接口
  if (url.pathname === api.API_LIST) {
    const list = api.filterMockList(queryParams(url));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 0, data: { list, total: list.length } }));
    return;
  }

  // 导出接口（只返回当前查询结果）
  if (url.pathname === api.API_EXPORT) {
    const list = api.filterMockList(queryParams(url));
    const csv = api.buildForkliftCsv(list);
    const filename = encodeURIComponent('叉车档案.csv');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="forklifts.csv"; filename*=UTF-8''${filename}`
    });
    res.end(csv);
    return;
  }

  // 静态文件
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`叉车档案本地联调服务已启动: http://localhost:${PORT}`);
  console.log(`示例接口: http://localhost:${PORT}${api.API_LIST}?warehouseZone=A`);
});
