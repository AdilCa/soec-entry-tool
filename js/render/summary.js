/* 电池构型链：显示在电池块标题后。空值 / none / NR 一律省略
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
