/* 校验：失焦单字段校验 + 导出前全量校验。
   产出纯数据（错误表、警告、计数），展示由 exporter 负责。 */
import { REQUIRED_KEYS, PATTERNS, LABELS, NUMERIC } from "./config.js";

/* 失焦时校验单个字段，返回错误消息或 null */
export function validateField(path, value) {
  const key = path.split(".").pop();
  const v = String(value).trim();

  if (REQUIRED_KEYS.has(key) && !v) return "必填项";
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
  /* 样品名称是导出记录关联材料的键，必须唯一 */
  const seen = new Set();
  state.materials.forEach((m, mi) => {
    const name = m.sample_name.trim();
    if (!name) {
      errors[`materials.${mi}.sample_name`] = "必填项";
    } else if (seen.has(name)) {
      errors[`materials.${mi}.sample_name`] = "样品名称重复";
    }
    seen.add(name);
    if (!m.composition.some((c) => c.trim())) {
      errors[`materials.${mi}.composition.0`] = "化学组成至少填一项";
    }
  });

  /* 格式警告（不拦截） */
  const pd = state.publication_date.trim();
  if (pd && !PATTERNS.publication_date.re.test(pd)) {
    warnings.push(`发表日期 "${pd}" 格式不规范（应为 YYYY-MM）`);
  }

  /* NR / 空白计数；数值列出现非数字时警告（多半是录入笔误） */
  let nrCount = 0;
  let emptyCount = 0;
  walk(state, "", (v, path) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    if (t === "NR") nrCount++;
    else if (t === "") emptyCount++;
    else if (NUMERIC.has(path.split(".").pop()) && t !== "none" && isNaN(Number(t))) {
      warnings.push(`${describePath(path)} 的值 "${t}" 不是数字`);
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

function walk(node, path, cb) {
  if (node && typeof node === "object") {
    return Object.entries(node).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, cb));
  }
  cb(node, path);
}

/* 给检查清单用的友好路径描述，如"材料 1 · 单电池 1 · 第 3 行 · 电压 (V)" */
const PART = {
  materials: (n) => `材料 ${n}`,
  symmetric_cell: (n) => `对称电池 ${n}`,
  single_cell: (n) => `单电池 ${n}`,
  measurements: (n) => `第 ${n} 行`,
  stability: (n) => `稳定性第 ${n} 行`,
  composition: () => LABELS.composition,
};

export function describePath(path) {
  const ks = path.split(".");
  const out = [];
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    if (PART[k] && i + 1 < ks.length) {
      out.push(PART[k](Number(ks[i + 1]) + 1));
      i++;
    } else {
      out.push(LABELS[k] || k);
    }
  }
  return out.join(" · ");
}
