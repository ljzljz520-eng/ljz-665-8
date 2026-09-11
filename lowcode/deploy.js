#!/usr/bin/env node
/**
 * 低代码平台菜单发布脚本
 *
 * 作用：把 lowcode/menu.config.json 真正注册到目标平台实例，并校验已挂载页面可达，
 *       最终生成发布回执 lowcode/deploy-receipt.json（作为本次交付可直接挂载的凭证）。
 *
 * 必填环境变量：
 *   LOWCODE_PLATFORM_URL  平台实例地址，如 https://lowcode.example.com
 *   LOWCODE_API_TOKEN     平台 OpenAPI 访问令牌（需要菜单管理权限）
 *   FORKLIFT_PUBLIC_URL   本服务对外可访问地址（平台 iframe 必须可达），如 https://wh.example.com
 *
 * 可选环境变量：
 *   LOWCODE_MENU_API      平台菜单注册接口路径，默认 /api/open/menus
 *   LOWCODE_VERIFY_TLS    是否校验 TLS，默认 true（自签名证书可设为 false）
 *
 * 用法：
 *   cp .env.example .env 并填入真实值（或直接 export 环境变量）
 *   node lowcode/deploy.js            # 正式发布
 *   node lowcode/deploy.js --dry-run  # 只打印将发送的请求与绝对地址，不调用平台
 *
 * 说明：不同平台的 OpenAPI 路径/鉴权头可能不同，本脚本按常见约定实现；
 *       如平台不同，调整下方 MENU_API / 鉴权头即可，回执与挂载校验流程不变。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(__dirname, 'menu.config.json');
const RECEIPT_FILE = path.join(__dirname, 'deploy-receipt.json');

const DRY_RUN = process.argv.includes('--dry-run');
const PLATFORM_URL = (process.env.LOWCODE_PLATFORM_URL || '').replace(/\/+$/, '');
const API_TOKEN = process.env.LOWCODE_API_TOKEN || '';
const PUBLIC_URL = (process.env.FORKLIFT_PUBLIC_URL || '').replace(/\/+$/, '');
const MENU_API_PATH = process.env.LOWCODE_MENU_API || '/api/open/menus';
const VERIFY_TLS = process.env.LOWCODE_VERIFY_TLS !== 'false';

if (!DRY_RUN) {
  const missing = [];
  if (!PLATFORM_URL) missing.push('LOWCODE_PLATFORM_URL');
  if (!API_TOKEN) missing.push('LOWCODE_API_TOKEN');
  if (!PUBLIC_URL) missing.push('FORKLIFT_PUBLIC_URL');
  if (missing.length) {
    console.error('缺少必填环境变量：' + missing.join(', '));
    console.error('可先执行 node lowcode/deploy.js --dry-run 查看发布内容');
    process.exit(1);
  }
}

// 读取菜单配置，把相对 iframeUrl / component 渲染为平台可访问的绝对地址
const menuConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
const payload = JSON.parse(JSON.stringify(menuConfig));
payload.route.iframeUrl = (PUBLIC_URL || 'https://<FORKLIFT_PUBLIC_URL>') + menuConfig.route.iframeUrl;
payload.route.component = (PUBLIC_URL || 'https://<FORKLIFT_PUBLIC_URL>') + '/web/forklift-archive/index.html';
payload.deployedAt = new Date().toISOString();

const menuApi = (PLATFORM_URL || 'https://<LOWCODE_PLATFORM_URL>') + MENU_API_PATH;

console.log('==== 低代码菜单发布' + (DRY_RUN ? '（dry-run）' : '') + ' ====');
console.log('平台接口 :', menuApi);
console.log('菜单编码 :', payload.menuCode);
console.log('挂载地址 :', payload.route.iframeUrl);
console.log('');

async function request(url, options = {}, label = '') {
  if (!VERIFY_TLS) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${label}请求失败 HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return { status: res.status, body, headers: res.headers };
}

async function registerMenu() {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  };

  // 菜单已存在时（409/编码冲突），退化为按 menuCode 更新
  try {
    const r = await request(menuApi, options, '菜单注册');
    console.log('菜单注册成功，平台返回菜单ID：', r.body && r.body.data && (r.body.data.id || r.body.data.menuId));
    return { method: 'POST', httpStatus: r.status, response: r.body };
  } catch (e) {
    if (!/HTTP 409|conflict|已存在/i.test(e.message)) throw e;
    const putUrl = `${menuApi}/${encodeURIComponent(payload.menuCode)}`;
    const r = await request(putUrl, { ...options, method: 'PUT' }, '菜单更新');
    console.log('菜单已存在，更新成功');
    return { method: 'PUT', httpStatus: r.status, response: r.body };
  }
}

async function probe(url, label) {
  // 探活只记录结果、不抛异常：网络不通 / 非 200 都应写入回执，mounted=false
  try {
    const r = await request(url, { method: 'GET' }, label);
    return { httpStatus: r.status, reachable: r.status === 200, error: null };
  } catch (e) {
    return { httpStatus: null, reachable: false, error: e.message };
  }
}

async function verifyMounted() {
  // 1) 平台 iframe 地址对应的页面必须可达
  const pageProbe = await probe(payload.route.iframeUrl, '挂载页面探活');
  // 2) 页面依赖的列表接口必须可达且业务码正常（平台内调用走 PUBLIC_URL 同源地址）
  const apiUrl = `${PUBLIC_URL}/api/warehouse/forklifts?page=1&pageSize=1`;
  const apiProbe = await probe(apiUrl, '列表接口探活');
  let apiBusinessOk = false;
  if (apiProbe.reachable) {
    try {
      const r = await request(apiUrl, { method: 'GET' }, '列表接口业务码');
      apiBusinessOk = !!(r.body && r.body.code === 0);
    } catch {
      apiBusinessOk = false;
    }
  }
  return {
    pageUrl: payload.route.iframeUrl,
    pageHttpStatus: pageProbe.httpStatus,
    pageReachable: pageProbe.reachable,
    pageError: pageProbe.error,
    apiUrl,
    apiHttpStatus: apiProbe.httpStatus,
    apiHealthy: apiProbe.reachable && apiBusinessOk,
    apiError: apiProbe.error,
  };
}

async function main() {
  if (DRY_RUN) {
    console.log('dry-run 不调用平台，实际将发送：\n');
    console.log(`curl -X POST '${menuApi}' \\`);
    console.log(`  -H 'Content-Type: application/json' \\`);
    console.log(`  -H 'Authorization: Bearer <LOWCODE_API_TOKEN>' \\`);
    console.log(`  -d '${JSON.stringify(payload)}'`);
    console.log('\n发布成功后将执行挂载探活：');
    console.log('  GET ' + payload.route.iframeUrl);
    console.log('  GET ' + (PUBLIC_URL || 'https://<FORKLIFT_PUBLIC_URL>') + '/api/warehouse/forklifts?page=1&pageSize=1');
    console.log(`\n并生成回执：${path.relative(ROOT, RECEIPT_FILE)}`);
    return;
  }

  const startedAt = new Date().toISOString();
  const registerResult = await registerMenu();
  const verification = await verifyMounted();
  const receipt = {
    menuCode: payload.menuCode,
    menuName: payload.menuName,
    parentMenu: payload.parentMenu,
    routePath: payload.route.path,
    iframeUrl: payload.route.iframeUrl,
    platformUrl: PLATFORM_URL,
    registerApi: menuApi,
    registerMethod: registerResult.method,
    registerHttpStatus: registerResult.httpStatus,
    platformMenuId:
      registerResult.response && registerResult.response.data &&
      (registerResult.response.data.menuId || registerResult.response.data.id) || null,
    permission: payload.permission,
    mounted: verification.pageReachable && verification.apiHealthy,
    verification,
    deployedAt: startedAt,
    deployedBy: process.env.LOWCODE_OPERATOR || null,
  };

  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2), 'utf8');
  console.log('');
  if (!receipt.mounted) {
    console.warn('菜单已注册，但挂载探活未全部通过，请检查回执 verification 字段：', RECEIPT_FILE);
    process.exitCode = 2;
  } else {
    console.log('发布成功，菜单已在平台可挂载，回执：', path.relative(ROOT, RECEIPT_FILE));
  }
}

main().catch((e) => {
  console.error('发布失败：', e.message);
  process.exit(1);
});
