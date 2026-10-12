/* 单电池：结构（五层构型链）+ 测量表（条件 + I–V 数据点）+ 稳定性表（默认空） */
import { store } from "../store.js";
import { SC_LAYERS } from "../config.js";
import { field, table, addBtn, removeBtn, collapseBtn } from "./field.js";
import { scConfig } from "./summary.js";

export function renderSingleCell(cells, mi) {
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>单电池<span class="count">${cells.length} 组</span></h3>
      ${addBtn(`materials.${mi}.single_cell`, "sc", "+ 添加单电池")}
    </div>
    ${cells.map((c, ci) => renderCell(c, mi, ci)).join("")}
  </div>`;
}

function renderCell(c, mi, ci) {
  const base = `materials.${mi}.single_cell.${ci}`;
  const collapsed = store.collapsed.has(base);
  const counts = `${c.measurements.length} 行 I–V${c.stability.length ? ` · ${c.stability.length} 行稳定性` : ""}`;
  return `
  <div class="block inset${collapsed ? " collapsed" : ""}">
    <div class="block-head">
      <span class="t">${collapseBtn(base)}单电池 ${ci + 1}<span class="collapsed-summary">${
        scConfig(c)} · ${counts}</span></span>
      ${removeBtn(base)}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields cols-5">
      ${SC_LAYERS.map((k) => field(`${base}.${k}`, k)).join("")}
    </div>
    <h4 class="grid-title">I–V 数据</h4>
    ${table(`${base}.measurements`, "scRow", { minRows: 0 })}
    <h4 class="grid-title">稳定性测试</h4>
    ${table(`${base}.stability`, "stabRow", { minRows: 0, addText: "+ 添加稳定性测试" })}
    </div></div>
  </div>`;
}
