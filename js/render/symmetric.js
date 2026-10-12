/* 对称电池：结构（电解质、缓冲层）+ 测量表（气氛 / 温度 / 极化电阻） */
import { store } from "../store.js";
import { field, table, addBtn, removeBtn, collapseBtn } from "./field.js";
import { symConfig } from "./summary.js";

export function renderSymmetric(cells, mi) {
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>对称电池<span class="count">${cells.length} 组</span></h3>
      ${addBtn(`materials.${mi}.symmetric_cell`, "sym", "+ 添加对称电池")}
    </div>
    ${cells.map((s, si) => renderSymCell(s, mi, si)).join("")}
  </div>`;
}

function renderSymCell(s, mi, si) {
  const base = `materials.${mi}.symmetric_cell.${si}`;
  const collapsed = store.collapsed.has(base);
  const sampleName = store.state.materials[mi].sample_name.trim() || `材料 ${mi + 1}`;
  return `
  <div class="block inset${collapsed ? " collapsed" : ""}">
    <div class="block-head">
      <span class="t">${collapseBtn(base)}对称电池 ${si + 1}<span class="collapsed-summary">${
        symConfig(s, sampleName)} · ${s.measurements.length} 行</span></span>
      ${removeBtn(base)}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields cols-4">
      ${field(`${base}.electrolyte`, "electrolyte")}
      ${field(`${base}.buffer_layer`, "buffer_layer")}
    </div>
    ${table(`${base}.measurements`, "symRow")}
    </div></div>
  </div>`;
}
