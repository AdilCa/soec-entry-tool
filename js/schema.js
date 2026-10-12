/* 空白对象工厂：所有新条目/子结构的初始形状都在这里定义。 */

export const blankSymMeasurement = () => ({
  atmosphere: "",
  temperature_C: "NR",
  polarization_resistance_Ohm_cm2: "NR",
  test_potential: "OCV",
  notes: "",
});

export const blankIV = () => ({
  voltage_V: "NR",
  current_density_A_cm2: "NR",
});

/* _showRates 是界面状态（产率/效率列开关），导出时会被剔除 */
export const blankSCMeasurement = () => ({
  cathode_atmosphere: "",
  anode_atmosphere: "",
  cathode_flow: "NR",
  anode_flow: "NR",
  temperature_C: "NR",
  iv_points: [blankIV()],
  _showRates: false,
});

export const blankStability = () => ({
  cathode_atmosphere: "",
  anode_atmosphere: "",
  cathode_flow: "NR",
  anode_flow: "NR",
  temperature_C: "NR",
  mode: "",
  setpoint: "NR",
  duration_h: "NR",
  degradation_rate_per_h: "NR",
});

/* 对称电池：被测电极即样品本身，故无电极材料字段；
   电极厚度/缓冲层厚度照常报道。电解质、缓冲层按"材料 | 厚度"配对 */
export const blankSymCell = () => ({
  current_collector: "",
  electrolyte: "",
  electrolyte_thickness_um: "NR",
  buffer_layer: "NR",
  buffer_layer_thickness_um: "NR",
  electrode_thickness_um: "NR",
  measurements: [blankSymMeasurement()],
});

/* 结构区按"材料 | 厚度"成对；稳定性默认空（很多文献不做），手动添加 */
export const blankSingleCell = () => ({
  current_collector: "",
  electrode_area_cm2: "NR",
  cathode: "",
  cathode_thickness_um: "NR",
  buffer_layer_cathode: "NR",
  buffer_layer_cathode_thickness_um: "NR",
  electrolyte: "",
  electrolyte_thickness_um: "NR",
  buffer_layer_anode: "NR",
  buffer_layer_anode_thickness_um: "NR",
  anode: "",
  anode_thickness_um: "NR",
  measurements: [blankSCMeasurement()],
  stability: [],
});

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
  symMeas: blankSymMeasurement,
  sc: blankSingleCell,
  scMeas: blankSCMeasurement,
  iv: blankIV,
  stability: blankStability,
  comp: () => "",
};
