/* 对称电池：电极厚度|集流体 + 电解质|厚度、缓冲层|厚度配对 + 测量数组（可折叠，差异摘要） */
import { store } from "../store.js";
import { field, pairRow, addBtn, removeBtn, collapseBtn } from "./field.js";
import { condSummary, summaryText, symConfig } from "./summary.js";

const MEAS_COND_KEYS = ["atmosphere", "temperature_C", "test_potential"];

export function renderSymmetric(cells, mi) {
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>对称电池<span class="count">${cells.length} 组</span></h3>
      ${addBtn(`materials.${mi}.symmetric_cell`, "sym", "+ 添加对称电池")}
    </div>
    ${cells.length ? "" : `<p class="empty-hint">尚无数据，点击右上角添加</p>`}
    ${cells.map((s, si) => renderSymCell(s, mi, si, cells.length)).join("")}
  </div>`;
}

function renderSymCell(s, mi, si, total) {
  const base = `materials.${mi}.symmetric_cell.${si}`;
  const collapsed = store.collapsed.has(base);
  const sampleName =
    store.state.materials[mi].sample_name.trim() || `材料 ${mi + 1}`;
  return `
  <div class="block inset${collapsed ? " collapsed" : ""}">
    <div class="block-head">
      <span class="t">${collapseBtn(base)}对称电池 ${si + 1}${
        collapsed ? `<span class="collapsed-summary">${symConfig(s, sampleName)}</span>` : ""
      }</span>
      ${total > 1 ? removeBtn(base) : ""}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields">
      ${field(`${base}.electrode_thickness_um`, "electrode_thickness_um")}
      ${field(`${base}.current_collector`, "current_collector")}
      ${pairRow(base, "electrolyte", "electrolyte_thickness_um")}
      ${pairRow(base, "buffer_layer", "buffer_layer_thickness_um")}
    </div>
    ${renderBody(base, s)}
    </div></div>
  </div>`;
}

function renderBody(base, s) {
  return `
    <div class="sub">
      <div class="sub-head">
        <h3>测量数据<span class="count">${s.measurements.length} 条</span></h3>
        ${addBtn(`${base}.measurements`, "symMeas", "+ 添加测量")}
      </div>
      ${renderMeasList(base, s)}
    </div>`;
}

function renderMeasList(base, s) {
  const summary = condSummary(s.measurements, MEAS_COND_KEYS);
  return s.measurements.map((me, mei) => {
    const mBase = `${base}.measurements.${mei}`;
    const collapsed = store.collapsed.has(mBase);
    return `
    <div class="block${collapsed ? " collapsed" : ""}">
      <div class="block-head">
        <span class="t">${collapseBtn(mBase)}测量 ${mei + 1}${
          collapsed ? `<span class="collapsed-summary">${summaryText(summary, me)}</span>` : ""
        }</span>
        ${s.measurements.length > 1 ? removeBtn(mBase) : ""}
      </div>
      <div class="block-body"><div class="body-in">
      <div class="fields">
        ${field(`${mBase}.atmosphere`, "atmosphere")}
        ${field(`${mBase}.temperature_C`, "temperature_C")}
        ${field(`${mBase}.polarization_resistance_Ohm_cm2`, "polarization_resistance_Ohm_cm2")}
        ${field(`${mBase}.test_potential`, "test_potential")}
        ${field(`${mBase}.notes`, "notes", { full: true })}
      </div>
      </div></div>
    </div>`;
  }).join("");
}
