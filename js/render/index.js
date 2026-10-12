/* 渲染调度：拼装各分区。所有渲染器无状态，只读 store。
   整体替换 innerHTML 会销毁焦点所在的控件，因此渲染后按 data-path 恢复焦点；
   传入 focusPath 时改为聚焦该控件（新增行/块后直接进入输入）；
   focusPath 指向一个块（非控件）时聚焦块内第一个控件。 */
import { renderMeta } from "./meta.js";
import { renderMaterials } from "./material.js";
import { alignDecimals } from "../prefs.js";

export function renderForm(focusPath) {
  const form = document.getElementById("form");
  const active = document.activeElement;
  const target = focusPath ?? (form.contains(active) ? active.dataset.path : null);
  form.innerHTML = renderMeta() + renderMaterials();
  alignDecimals(form);
  if (!target) return;
  const el =
    form.querySelector(`:is(input, select, textarea)[data-path="${target}"]`) ||
    form.querySelector(`:is(input, select, textarea)[data-path^="${target}."]`);
  if (!el) return;
  el.focus({ preventScroll: !focusPath });
  if (focusPath && el.select) el.select();
}
