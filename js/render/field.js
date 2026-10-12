/* 单个字段的渲染：两行标签（中文 + JSON 键名）+ 输入控件 + 错误提示。
   所有渲染器共用，保证视觉一致。 */
import { LABELS, MEMORY_KEYS, ENUMS } from "../config.js";
import { store, getPath } from "../store.js";
import { esc } from "../util.js";

export function field(path, key, opts = {}) {
  const v = getPath(store.state, path) ?? ""; // 旧版导入文件可能缺新键
  const lab = LABELS[key] || key;
  const err = store.errors[path];
  const req = opts.required ? `<span class="req">*</span>` : "";
  const mem = MEMORY_KEYS.has(key) ? ` data-memory="${key}"` : "";
  const invalid = err ? " invalid" : "";
  const dis = opts.disabled ? " disabled" : "";
  const links = opts.links ? ` data-links="${opts.links}"` : "";

  let control;
  if (ENUMS[key]) {
    const options = [`<option value="">未选</option>`]
      .concat(ENUMS[key].map((o) => `<option value="${o}"${v === o ? " selected" : ""}>${o}</option>`))
      .join("");
    control = `<select class="${invalid.trim()}" data-path="${path}" data-key="${key}">${options}</select>`;
  } else if (opts.textarea) {
    control = `<textarea data-path="${path}" data-key="${key}">${esc(v)}</textarea>`;
  } else {
    const ph = opts.ph ? ` placeholder="${opts.ph}"` : "";
    control = `<input type="text" class="${invalid.trim()}" data-path="${path}" data-key="${key}"${mem}${links}${dis} value="${esc(v)}"${ph} autocomplete="off">`;
  }

  return `<label class="f ${opts.full ? "full" : ""}">
    <span class="lab"><span class="lab-cn">${lab}${req}</span><span class="lab-key">${key}</span></span>
    ${control}
    ${err ? `<p class="field-error">${err}</p>` : ""}
  </label>`;
}

/* "材料 | 厚度"配对行：材料填 NR/none 时厚度自动跟随并锁定 */
export function pairRow(base, matKey, thKey) {
  const matVal = String(getPath(store.state, `${base}.${matKey}`) ?? "").trim();
  const locked = matVal === "NR" || matVal === "none";
  return `
    ${field(`${base}.${matKey}`, matKey, { links: `${base}.${thKey}` })}
    ${field(`${base}.${thKey}`, thKey, { disabled: locked })}
  `;
}

/* 结构块的增删/折叠按钮 */
export const addBtn = (path, factory, text) =>
  `<button class="add" data-action="add" data-path="${path}" data-factory="${factory}">${text}</button>`;

export const removeBtn = (path, text = "删除") =>
  `<button class="remove" data-action="remove" data-path="${path}">${text}</button>`;

/* 折叠三角：不用字符（▸▾ 在中文字体中字形过小），改用 CSS 绘制，
   尺寸可控、跨字体一致；方向由 .collapsed 状态驱动旋转 */
export const collapseBtn = (path) =>
  `<button class="collapse" data-collapse="${path}" aria-label="折叠/展开"><span class="tri"></span></button>`;
