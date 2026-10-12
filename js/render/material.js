/* 材料块：样品名/组成/合成方法/调控方法 + 对称电池 + 单电池 */
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
  return `
  <div class="block${collapsed ? " collapsed" : ""}">
    <div class="block-head">
      <span class="t">${collapseBtn(base)}<span class="block-name">${esc(title)}</span> <span>· materials[${mi}]</span></span>
      ${total > 1 ? removeBtn(base) : ""}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields">
      ${field(`${base}.sample_name`, "sample_name", { required: true })}
      ${field(`${base}.synthesis_method`, "synthesis_method")}
      ${field(`${base}.modification_method`, "modification_method", { ph: "如 掺杂 / 析出 / 高熵" })}
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
  <div class="sub">
    <div class="sub-head">
      <h3>化学组成 <span class="req">*</span><span class="count">${list.length} 项</span></h3>
      ${addBtn(`materials.${mi}.composition`, "comp", "+ 添加组分")}
    </div>
    <div class="rows">
      ${list.map((c, ci) => `
      <div class="row-line">
        <input type="text" data-path="materials.${mi}.composition.${ci}" data-key="composition"
               data-memory="composition" value="${esc(c)}" placeholder="如 Ni-YSZ"
               autocomplete="off"${err ? ' class="invalid"' : ""}>
        ${list.length > 1 ? removeBtn(`materials.${mi}.composition.${ci}`, "移除") : ""}
      </div>`).join("")}
    </div>
    ${err ? `<p class="field-error">${err}</p>` : ""}
  </div>`;
}
