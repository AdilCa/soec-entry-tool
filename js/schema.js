/* 空白对象工厂：所有新条目/子结构的初始形状都在这里定义。
   工厂接收 prev（同一列表中的上一项，可能为 undefined）：
   数据行沿用上一行的条件列，电池沿用上一组电池的结构。 */
import { TABLES, SC_LAYERS, SYM_LAYERS } from "./config.js";

const carry = (row, prev, keys) => {
  if (prev) keys.forEach((k) => (row[k] = prev[k] ?? row[k]));
  return row;
};

export const blankSymRow = (prev) => carry({
  atmosphere: "",
  temperature_C: "NR",
  polarization_resistance_Ohm_cm2: "NR",
}, prev, TABLES.symRow.carry);

export const blankSCRow = (prev) => carry({
  cathode_atmosphere: "",
  anode_atmosphere: "",
  temperature_C: "NR",
  voltage_V: "NR",
  current_density_A_cm2: "NR",
}, prev, TABLES.scRow.carry);

export const blankStabRow = (prev) => carry({
  cathode_atmosphere: "",
  anode_atmosphere: "",
  temperature_C: "NR",
  mode: "",
  setpoint: "NR",
  duration_h: "NR",
  degradation_rate_per_h: "NR",
}, prev, TABLES.stabRow.carry);

/* 对称电池：被测电极即样品本身，故无电极材料字段 */
export const blankSymCell = (prev) => carry({
  electrolyte: "",
  buffer_layer: "NR",
  measurements: [blankSymRow()],
}, prev, SYM_LAYERS);

/* 稳定性默认空（很多文献不做），手动添加 */
export const blankSingleCell = (prev) => carry({
  cathode: "",
  buffer_layer_cathode: "NR",
  electrolyte: "",
  buffer_layer_anode: "NR",
  anode: "",
  measurements: [blankSCRow()],
  stability: [],
}, prev, SC_LAYERS);

export const blankMaterial = () => ({
  sample_name: "",
  composition: [""],
  synthesis_method: "",
  modification_method: "",
  symmetric_cell: [],
  single_cell: [],
});

export const blankRoot = () => ({
  doi: "",
  title: "",
  journal: "",
  publication_date: "",
  authors: "",
  materials: [blankMaterial()],
  overall_notes: "",
});

/* data-action="add" 时按工厂名取新对象 */
export const FACTORIES = {
  material: blankMaterial,
  sym: blankSymCell,
  sc: blankSingleCell,
  symRow: blankSymRow,
  scRow: blankSCRow,
  stabRow: blankStabRow,
  comp: () => "",
};
