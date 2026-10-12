/* 校验：失焦单字段校验 + 导出前全量校验。
   产出纯数据（错误表、警告、计数），展示由 exporter 负责。 */
import { REQUIRED_KEYS, PATTERNS, LABELS } from "./config.js";
import { getPath } from "./store.js";

/* 失焦时校验单个字段，返回错误消息或 null */
export function validateField(path, value) {
  const key = path.split(".").pop();
  const v = String(value).trim();

  if (REQUIRED_KEYS.has(key) && !v) return "必填项";
  if (key === "composition" && !v) return null; // 组分在 validateAll 中按数组校验
  const p = PATTERNS[key];
  if (p && v && !p.re.test(v)) return p.msg;
  return null;
}

/* 全量校验：返回 { blocking, errors, warnings, nrCount, emptyCount } */
export function validateAll(state) {
  const errors = {};
  const warnings = [];

  /* 必填 */
  if (!state.doi.trim()) {
    errors["doi"] = "必填项";
  } else if (!PATTERNS.doi.re.test(state.doi.trim())) {
    errors["doi"] = PATTERNS.doi.msg;
  }
  state.materials.forEach((m, mi) => {
    if (!m.sample_name.trim()) {
      errors[`materials.${mi}.sample_name`] = "必填项";
    }
    if (!m.composition.some((c) => c.trim())) {
      errors[`materials.${mi}.composition.0`] = "化学组成至少填一项";
    }
  });

  /* 格式警告（不拦截） */
  const pd = state.publication_date.trim();
  if (pd && !PATTERNS.publication_date.re.test(pd)) {
    warnings.push(`发表日期 "${pd}" 格式不规范（应为 YYYY-MM）`);
  }

  /* NR / 空白计数 */
  let nrCount = 0;
  let emptyCount = 0;
  walk(state, (v) => {
    if (typeof v === "string") {
      const t = v.trim();
      if (t === "NR") nrCount++;
      else if (t === "") emptyCount++;
    }
  });

  return {
    blocking: Object.keys(errors).length > 0,
    errors,
    warnings,
    nrCount,
    emptyCount,
  };
}

function walk(node, cb) {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, cb));
  if (node && typeof node === "object") {
    return Object.values(node).forEach((v) => walk(v, cb));
  }
  cb(node);
}

/* 给检查清单用的友好路径描述 */
export function describePath(path) {
  const ks = path.split(".");
  const last = ks[ks.length - 1];
  if (LABELS[last]) return LABELS[last];
  const parent = ks[ks.length - 2];
  return LABELS[parent] || path;
}
