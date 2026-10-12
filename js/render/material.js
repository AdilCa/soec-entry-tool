/* 材料块：样品名/合成方法/调控方法 + 化学组成 + 对称电池 + 单电池 */
import { store } from "../store.js";
import { esc } from "../util.js";
import { field, addBtn, removeBtn, collapseBtn } from "./field.js";
import { renderSymmetric } from "./symmetric.js";
import { renderSingleCell } from "./singleCell.js";

export function renderMaterials() {
  const ms = store.state.materials;
  return `
  <div class="section">
    <div class="section-head">
      <h2>材料 <span class="hint">${ms.length} 个样品</span></h2>
      ${addBtn("materials", "material", "+ 添加材料")}
    </div>
    ${ms.map((m, mi) => renderMaterial(m, mi, ms.length)).join("")}
  </div>`;
}

function renderMaterial(m, mi, total) {
  const base = `materials.${mi}`;
  const collapsed = store.collapsed.has(base);
  const title = m.sample_name.trim() || `材料 ${mi + 1}`;
  const counts = `对称电池 ${m.symmetric_cell.length} · 单电池 ${m.single_cell.length}`;
  return `
  <div class="block${collapsed ? " collapsed" : ""}">
    <div class="block-head" data-collapse="${base}">
      <span class="t">${collapseBtn(base)}<span class="block-name">${esc(title)}</span>${
        collapsed ? `<span class="collapsed-summary">${counts}</span>` : ""
      }</span>
      ${total > 1 ? removeBtn(base) : ""}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields cols-3">
      ${field(`${base}.sample_name`, "sample_name", { required: true })}
      ${field(`${base}.synthesis_method`, "synthesis_method")}
      ${field(`${base}.modification_method`, "modification_method", { ph: "如 doping / exsolution" })}
    </div>
    ${renderComposition(m.composition, mi)}
    ${renderSymmetric(m.symmetric_cell, mi)}
    ${renderSingleCell(m.single_cell, mi)}
    </div></div>
  </div>`;
}

function renderComposition(list, mi) {
  const err = store.errors[`materials.${mi}.composition.0`];
  return `
  <div class="comp">
    <span class="lab" title="composition">化学组成<span class="req">*</span></span>
    <div class="comp-items">
      ${list.map((c, ci) => `
      <span class="comp-item">
        <input type="text" data-path="materials.${mi}.composition.${ci}" data-key="composition"
               data-memory="composition" value="${esc(c ?? "")}" placeholder="如 Sr2Fe1.5Mo0.5O6-d"
               autocomplete="off"${err ? ' class="invalid"' : ""}>
        ${list.length > 1 ? removeBtn(`materials.${mi}.composition.${ci}`, "×", true) : ""}
      </span>`).join("")}
      ${addBtn(`materials.${mi}.composition`, "comp", "+ 组分")}
    </div>
    ${err ? `<p class="field-error">${err}</p>` : ""}
  </div>`;
}
