/* 单电池：结构区（材料|厚度成对）+ 测量数组（条件 + IV 数据对，产率列可选）
   + 稳定性数组（默认空）。块均可折叠，测量/稳定性折叠后显示差异摘要。 */
import { store } from "../store.js";
import { field, pairRow, addBtn, removeBtn, collapseBtn } from "./field.js";
import { condSummary, summaryText, scConfig } from "./summary.js";

const MEAS_COND_KEYS = [
  "cathode_atmosphere", "anode_atmosphere",
  "cathode_flow", "anode_flow", "temperature_C",
];
const STAB_COND_KEYS = [...MEAS_COND_KEYS, "mode"];

export function renderSingleCell(cells, mi) {
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>单电池<span class="count">${cells.length} 组</span></h3>
      ${addBtn(`materials.${mi}.single_cell`, "sc", "+ 添加单电池")}
    </div>
    ${cells.length ? "" : `<p class="empty-hint">尚无数据，点击右上角添加</p>`}
    ${cells.map((c, ci) => renderCell(c, mi, ci, cells.length)).join("")}
  </div>`;
}

function renderCell(c, mi, ci, total) {
  const base = `materials.${mi}.single_cell.${ci}`;
  const collapsed = store.collapsed.has(base);
  return `
  <div class="block inset${collapsed ? " collapsed" : ""}">
    <div class="block-head">
      <span class="t">${collapseBtn(base)}单电池 ${ci + 1}${
        collapsed ? `<span class="collapsed-summary">${scConfig(c)}</span>` : ""
      }</span>
      ${total > 1 ? removeBtn(base) : ""}
    </div>
    <div class="block-body"><div class="body-in">
    <div class="fields">
      ${field(`${base}.current_collector`, "current_collector")}
      ${field(`${base}.electrode_area_cm2`, "electrode_area_cm2")}
      ${pairRow(base, "cathode", "cathode_thickness_um")}
      ${pairRow(base, "buffer_layer_cathode", "buffer_layer_cathode_thickness_um")}
      ${pairRow(base, "electrolyte", "electrolyte_thickness_um")}
      ${pairRow(base, "buffer_layer_anode", "buffer_layer_anode_thickness_um")}
      ${pairRow(base, "anode", "anode_thickness_um")}
    </div>
    ${renderMeasurements(c.measurements, base)}
    ${renderStability(c.stability, base)}
    </div></div>
  </div>`;
}

function renderMeasurements(list, cellBase) {
  const summary = condSummary(list, MEAS_COND_KEYS);
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>测量数据<span class="count">${list.length} 条</span></h3>
      ${addBtn(`${cellBase}.measurements`, "scMeas", "+ 添加测量")}
    </div>
    ${list.map((me, mei) => {
      const base = `${cellBase}.measurements.${mei}`;
      const collapsed = store.collapsed.has(base);
      return `
      <div class="block${collapsed ? " collapsed" : ""}">
        <div class="block-head">
          <span class="t">${collapseBtn(base)}测量 ${mei + 1}${
            collapsed ? `<span class="collapsed-summary">${summaryText(summary, me)}</span>` : ""
          }</span>
          ${list.length > 1 ? removeBtn(base) : ""}
        </div>
        <div class="block-body"><div class="body-in">
        <div class="fields">
          ${field(`${base}.cathode_atmosphere`, "cathode_atmosphere")}
          ${field(`${base}.anode_atmosphere`, "anode_atmosphere")}
          ${field(`${base}.cathode_flow`, "cathode_flow")}
          ${field(`${base}.anode_flow`, "anode_flow")}
          ${field(`${base}.temperature_C`, "temperature_C")}
        </div>
        ${renderIV(me, base)}
        </div></div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderIV(me, measBase) {
  /* 产率/效率列：界面开关 _showRates，或导入的数据自带这两个键 */
  const showRates =
    me._showRates || me.iv_points.some((p) => "co_production_ml_min_cm2" in p);
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>I–V 数据对<span class="count">${me.iv_points.length} 组</span></h3>
      <span class="sub-actions">
        <button class="add" data-action="toggle-rates" data-path="${measBase}">${
          showRates ? "− 移除产率/效率列" : "+ 添加产率/效率列"
        }</button>
        ${addBtn(`${measBase}.iv_points`, "iv", "+ 添加数据对")}
      </span>
    </div>
    <div class="rows">
      ${me.iv_points.map((iv, ii) => `
      <div class="iv-row${showRates ? " rates" : ""}">
        ${field(`${measBase}.iv_points.${ii}.voltage_V`, "voltage_V")}
        ${field(`${measBase}.iv_points.${ii}.current_density_A_cm2`, "current_density_A_cm2")}
        ${showRates ? field(`${measBase}.iv_points.${ii}.co_production_ml_min_cm2`, "co_production_ml_min_cm2") : ""}
        ${showRates ? field(`${measBase}.iv_points.${ii}.faradaic_efficiency_percent`, "faradaic_efficiency_percent") : ""}
        ${me.iv_points.length > 1 ? removeBtn(`${measBase}.iv_points.${ii}`, "移除") : "<span></span>"}
      </div>`).join("")}
    </div>
  </div>`;
}

function renderStability(list, cellBase) {
  const summary = condSummary(list, STAB_COND_KEYS);
  return `
  <div class="sub">
    <div class="sub-head">
      <h3>稳定性测试<span class="count">${list.length} 次</span></h3>
      ${addBtn(`${cellBase}.stability`, "stability", "+ 添加稳定性测试")}
    </div>
    ${list.length ? "" : `<p class="empty-hint">尚无数据，点击右上角添加</p>`}
    ${list.map((st, si) => {
      const base = `${cellBase}.stability.${si}`;
      const collapsed = store.collapsed.has(base);
      return `
      <div class="block${collapsed ? " collapsed" : ""}">
        <div class="block-head">
          <span class="t">${collapseBtn(base)}稳定性 ${si + 1}${
            collapsed ? `<span class="collapsed-summary">${summaryText(summary, st)}</span>` : ""
          }</span>
          ${removeBtn(base)}
        </div>
        <div class="block-body"><div class="body-in">
        <div class="fields">
          ${field(`${base}.cathode_atmosphere`, "cathode_atmosphere")}
          ${field(`${base}.anode_atmosphere`, "anode_atmosphere")}
          ${field(`${base}.cathode_flow`, "cathode_flow")}
          ${field(`${base}.anode_flow`, "anode_flow")}
          ${field(`${base}.temperature_C`, "temperature_C")}
          ${field(`${base}.mode`, "mode")}
          ${field(`${base}.setpoint`, "setpoint")}
          ${field(`${base}.duration_h`, "duration_h")}
          ${field(`${base}.degradation_rate_per_h`, "degradation_rate_per_h")}
        </div>
        </div></div>
      </div>`;
    }).join("")}
  </div>`;
}
