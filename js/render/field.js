/* 渲染积木：单个字段（单行中文标签，JSON 键名放在悬停提示里）、数据表、增删/折叠按钮。
   所有渲染器共用，保证视觉一致。 */
import { LABELS, MEMORY_KEYS, ENUMS, TABLES, NUMERIC, COL_WEIGHT } from "../config.js";
import { store, getPath } from "../store.js";
import { esc } from "../util.js";

/* 输入控件本身（字段与表格单元格共用） */
function control(path, key, opts = {}) {
  const v = getPath(store.state, path) ?? ""; // 导入文件可能缺键
  /* nr：灰显未报道值（输入时由 main.js 同步）；num：数值列，供对齐方式使用 */
  const cls = [
    store.errors[path] && "invalid",
    String(v).trim() === "NR" && "nr",
    NUMERIC.has(key) && "num",
  ].filter(Boolean).join(" ");
  if (ENUMS[key]) {
    const options = [`<option value="">未选</option>`]
      .concat(ENUMS[key].map((o) => `<option value="${o}"${v === o ? " selected" : ""}>${o}</option>`))
      .join("");
    return `<select class="${cls}" data-path="${path}" data-key="${key}">${options}</select>`;
  }
  if (opts.textarea) {
    return `<textarea data-path="${path}" data-key="${key}">${esc(v)}</textarea>`;
  }
  const mem = MEMORY_KEYS.has(key) ? ` data-memory="${key}"` : "";
  const ph = opts.ph ? ` placeholder="${opts.ph}"` : "";
  return `<input type="text" class="${cls}" data-path="${path}" data-key="${key}"${mem} value="${esc(v)}"${ph} autocomplete="off">`;
}

export function field(path, key, opts = {}) {
  const err = store.errors[path];
  const req = opts.required ? `<span class="req">*</span>` : "";
  return `<label class="f${opts.full ? " full" : ""}">
    <span class="lab" title="${key}">${LABELS[key] || key}${req}</span>
    ${control(path, key, opts)}
    ${err ? `<p class="field-error">${err}</p>` : ""}
  </label>`;
}

/* 数据表：一行一个数据点。data-table / data-factory 供键盘导航、粘贴、新增行使用 */
export function table(path, factory, opts = {}) {
  const rows = getPath(store.state, path);
  const { cols } = TABLES[factory];
  const minRows = opts.minRows ?? 1;
  const head = cols.map((k) =>
    `<th title="${k}"${NUMERIC.has(k) ? ' class="num"' : ""}>${LABELS[k] || k}</th>`
  ).join("");
  const weights = cols.map((k) => COL_WEIGHT[k] ?? (NUMERIC.has(k) ? 1 : 1.4));
  const total = weights.reduce((a, b) => a + b, 0);
  const colgroup = weights.map((w) => `<col style="width:${((w / total) * 100).toFixed(2)}%">`).join("");
  const body = rows.map((_, ri) => `
    <tr>
      ${cols.map((k) => `<td>${control(`${path}.${ri}.${k}`, k)}</td>`).join("")}
      <td class="row-x">${rows.length > minRows ? removeBtn(`${path}.${ri}`, "×", true) : ""}</td>
    </tr>`).join("");
  return `
  <div class="grid-wrap">
    ${rows.length ? `
    <table class="grid" data-table="${path}" data-factory="${factory}">
      <colgroup>${colgroup}<col class="row-x-col"></colgroup>
      <thead><tr>${head}<th></th></tr></thead>
      <tbody>${body}</tbody>
    </table>` : ""}
    ${addBtn(path, factory, opts.addText || "+ 添加一行")}
  </div>`;
}

/* 结构块的增删/折叠按钮；行内删除按钮不参与 Tab 顺序，保证 Tab 连续走单元格 */
export const addBtn = (path, factory, text) =>
  `<button class="add" data-action="add" data-path="${path}" data-factory="${factory}">${text}</button>`;

export const removeBtn = (path, text = "删除", skipTab = false) =>
  `<button class="remove" data-action="remove" data-path="${path}"${skipTab ? ' tabindex="-1"' : ""}>${text}</button>`;

/* 折叠三角：不用字符（▸▾ 在中文字体中字形过小），改用 CSS 绘制 */
export const collapseBtn = (path) =>
  `<button class="collapse" data-collapse="${path}" aria-label="折叠/展开"><span class="tri"></span></button>`;
