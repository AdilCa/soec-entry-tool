/* 记忆候选存储：localStorage，按字段分别记忆，频率排序，容量淘汰。
   只在导出时由 exporter 调用 commitFromState 统一记录。 */
import { MEMORY_KEYS, MEMORY_IGNORE } from "./config.js";

const LS_KEY = "soec-entry-memory-v1";
const CAP = 50;

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* 存储满或禁用时静默失败 */ }
}

/* 某字段的记忆列表，按频率降序、同频按最近使用降序 */
export function list(key) {
  const items = loadAll()[key] || [];
  return [...items].sort((a, b) => b.n - a.n || b.t - a.t).map((i) => i.v);
}

export function record(key, value) {
  const v = String(value).trim();
  if (MEMORY_IGNORE.has(v)) return;
  const all = loadAll();
  const items = all[key] || [];
  const hit = items.find((i) => i.v === v);
  if (hit) {
    hit.n += 1;
    hit.t = Date.now();
  } else {
    items.push({ v, n: 1, t: Date.now() });
  }
  items.sort((a, b) => b.n - a.n || b.t - a.t);
  all[key] = items.slice(0, CAP);
  saveAll(all);
}

export function remove(key, value) {
  const all = loadAll();
  all[key] = (all[key] || []).filter((i) => i.v !== value);
  saveAll(all);
}

/* 导出时调用：遍历整份文档，把可记忆字段的值统一存档 */
export function commitFromState(state) {
  walk(state, null);
}

function walk(node, key) {
  if (Array.isArray(node)) {
    if (key === "composition") {
      node.forEach((v) => typeof v === "string" && record("composition", v));
    } else {
      node.forEach((v) => walk(v, null));
    }
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("_")) continue; // 界面内部状态不记忆
      if (MEMORY_KEYS.has(k) && typeof v === "string") record(k, v);
      walk(v, k);
    }
  }
}
