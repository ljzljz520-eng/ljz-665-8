/**
 * 档案数据存储（JSON 文件持久化）
 *
 * - 数据文件路径由环境变量 FORKLIFT_DB_FILE 指定，默认 server/data/forklifts.json
 * - 首次启动（文件不存在）时写入内置种子数据，之后所有增删改实时落盘
 * - 服务重启不会清空数据；如需重置，删除数据文件后重启即可
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_DB_FILE = path.join(__dirname, 'data', 'forklifts.json');
const DB_FILE = process.env.FORKLIFT_DB_FILE || DEFAULT_DB_FILE;

/* 内置种子数据：仅在数据文件不存在时用于初始化 */
function seedData() {
  return {
    seq: 7,
    list: [
      { id: 1, forkliftNo: 'FL-001', model: '杭叉 CPCD30', warehouseZone: 'A区', driver: '张伟', annualInspectionDate: '2026-03-15', maintenanceStatus: 'NORMAL', remark: '电动叉车' },
      { id: 2, forkliftNo: 'FL-002', model: '合力 CPD20', warehouseZone: 'A区', driver: '李强', annualInspectionDate: '2025-11-20', maintenanceStatus: 'REPAIRING', remark: '更换电瓶中' },
      { id: 3, forkliftNo: 'FL-003', model: '丰田 8FD30', warehouseZone: 'B区', driver: '王磊', annualInspectionDate: '2026-06-01', maintenanceStatus: 'NORMAL', remark: '' },
      { id: 4, forkliftNo: 'FL-004', model: '杭叉 CPCD50', warehouseZone: 'B区', driver: '赵敏', annualInspectionDate: '2025-09-30', maintenanceStatus: 'PENDING', remark: '年检临期' },
      { id: 5, forkliftNo: 'FL-005', model: '林德 E16', warehouseZone: 'C区', driver: '陈杰', annualInspectionDate: '2026-01-12', maintenanceStatus: 'NORMAL', remark: '冷库专用' },
      { id: 6, forkliftNo: 'FL-006', model: '合力 CPD35', warehouseZone: 'C区', driver: '刘洋', annualInspectionDate: '2024-12-05', maintenanceStatus: 'SCRAPPED', remark: '已报废待处置' },
      { id: 7, forkliftNo: 'FL-007', model: '丰田 8FB20', warehouseZone: 'D区', driver: '孙丽', annualInspectionDate: '2026-08-22', maintenanceStatus: 'NORMAL', remark: '' },
    ],
  };
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = seedData();
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf8');
    return seeded;
  }
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return { seq: Number(parsed.seq) || 0, list: Array.isArray(parsed.list) ? parsed.list : [] };
}

let db = load();
// 写入串行化，避免并发请求互相覆盖
let writeChain = Promise.resolve();

function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain.then(
    () => fs.promises.writeFile(DB_FILE, snapshot, 'utf8')
  );
  return writeChain;
}

module.exports = {
  DB_FILE,
  selectAll: () => db.list,
  nextId: () => ++db.seq,
  insert(item) {
    db.list.push(item);
    return persist().then(() => item);
  },
  update(item) {
    return persist().then(() => item);
  },
  remove(id) {
    const idx = db.list.findIndex((f) => f.id === id);
    if (idx === -1) return Promise.resolve(false);
    db.list.splice(idx, 1);
    return persist().then(() => true);
  },
};
