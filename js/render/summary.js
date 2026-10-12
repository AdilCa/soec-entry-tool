/* 折叠差异摘要：单组显示全部条件，多组只显示兄弟块间有差异的字段。 */
import { COND_SHORT } from "../config.js";

export function condSummary(items, keys) {
  const str = (it, k) => String(it[k] ?? "").trim();
  const present = keys.filter((k) => items.some((it) => str(it, k) !== ""));
  if (!present.length) return "未填写条件";

  /* 单组：完整显示 */
  if (items.length === 1) {
    return present.map((k) => `${COND_SHORT[k]} ${str(items[0], k)}`).join(" · ");
  }

  /* 多组：找出有差异的字段 */
  const diff = present.filter(
    (k) => new Set(items.map((it) => str(it, k))).size > 1
  );
  if (!diff.length) return "条件相同";

  /* 返回函数：每组只显示自己的差异字段值 */
  return (item) => diff.map((k) => `${COND_SHORT[k]} ${str(item, k)}`).join(" · ");
}

export function summaryText(summary, item) {
  return typeof summary === "function" ? summary(item) : summary;
}

/* 电池构型链：折叠块时显示。空值 / none / NR 一律省略
   （NR 视为无——有缓冲层的文献几乎总会写明材料）。 */
const SKIP = new Set(["", "none", "NR"]);
const seg = (v) => {
  const t = String(v ?? "").trim();
  return SKIP.has(t) ? null : t;
};

/* 单电池：阴极 / (阴极缓冲层) / 电解质 / (阳极缓冲层) / 阳极 */
export function scConfig(c) {
  const parts = [
    seg(c.cathode),
    seg(c.buffer_layer_cathode),
    seg(c.electrolyte),
    seg(c.buffer_layer_anode),
    seg(c.anode),
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "构型未填写";
}

/* 对称电池：样品 / (缓冲层) / 电解质 / (缓冲层) / 样品；
   样品始终用样品名称（调用方负责空值回退），中间层全空时只显示样品名 */
export function symConfig(s, name) {
  const mid = [seg(s.buffer_layer), seg(s.electrolyte), seg(s.buffer_layer)].filter(Boolean);
  return mid.length ? [name, ...mid, name].join(" / ") : name;
}
