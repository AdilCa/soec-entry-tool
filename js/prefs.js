/* 显示偏好：数值列对齐方式（left / right / decimal），存 localStorage。
   decimal：数值列用等宽字体右对齐，按列内最多小数位给其余值右侧补 ch 宽度，使小数点上下对齐。 */
const LS_KEY = "soec-entry-prefs-v1";
const MODES = ["left", "right", "decimal"];

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
};

export const getAlign = () => (MODES.includes(load().align) ? load().align : "left");

function setAlign(mode) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...load(), align: mode }));
  } catch { /* 存储满或禁用时静默失败 */ }
  apply();
}

/* 小数位数：无小数点记 -1（还缺小数点本身的一格）；非普通小数（NR、科学计数等）返回 null 不参与 */
const DEC = /^[-+]?\d*(?:\.(\d*))?$/;
function frac(v) {
  const t = v.trim();
  const m = t && DEC.exec(t);
  if (!m) return null;
  return m[1] === undefined ? -1 : m[1].length;
}

/* 在 scope 内（整个表单或单个表格）重新计算小数点对齐的右侧补位 */
export function alignDecimals(scope = document) {
  const on = getAlign() === "decimal";
  scope.querySelectorAll?.("table.grid").forEach((tbl) => {
    const byKey = {};
    tbl.querySelectorAll("input.num").forEach((el) => (byKey[el.dataset.key] ??= []).push(el));
    Object.values(byKey).forEach((els) => {
      const fs = els.map((el) => frac(el.value));
      const max = Math.max(0, ...fs.filter((f) => f !== null));
      els.forEach((el, i) => {
        const pad = on && max > 0 && fs[i] !== null ? max - fs[i] : 0;
        el.style.paddingRight = pad ? `calc(8px + ${pad}ch)` : "";
      });
    });
  });
}

function apply() {
  const mode = getAlign();
  document.documentElement.dataset.numAlign = mode;
  document.querySelectorAll("#alignCtl [data-align]").forEach((b) =>
    b.classList.toggle("on", b.dataset.align === mode)
  );
  alignDecimals();
}

export function initPrefs() {
  document.getElementById("alignCtl").addEventListener("click", (e) => {
    const b = e.target.closest("[data-align]");
    if (b) setAlign(b.dataset.align);
  });
  apply();
}
