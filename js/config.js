/* 唯一的"知识中心"：标签、数值字段、必填、枚举、可记忆字段。
   增删字段时只需改这里 + schema.js 的工厂，渲染器无需改动。 */

export const LABELS = {
  doi: "DOI",
  title: "标题",
  journal: "期刊",
  publication_date: "发表日期",
  authors: "作者",
  overall_notes: "整体备注",
  sample_name: "样品名称",
  composition: "化学组成",
  synthesis_method: "合成方法",
  modification_method: "调控方法",
  electrolyte: "电解质",
  electrolyte_thickness_um: "厚度",
  buffer_layer: "缓冲层",
  buffer_layer_thickness_um: "厚度",
  electrode_thickness_um: "电极厚度 (µm)",
  atmosphere: "气氛",
  temperature_C: "温度 (°C)",
  polarization_resistance_Ohm_cm2: "极化电阻 (Ω·cm²)",
  test_potential: "测试电位",
  notes: "备注",
  cathode: "阴极",
  cathode_thickness_um: "厚度",
  buffer_layer_cathode: "阴极缓冲层",
  buffer_layer_cathode_thickness_um: "厚度",
  buffer_layer_anode: "阳极缓冲层",
  buffer_layer_anode_thickness_um: "厚度",
  anode: "阳极",
  anode_thickness_um: "厚度",
  electrode_area_cm2: "电极面积 (cm²)",
  current_collector: "集流体",
  cathode_atmosphere: "阴极气氛",
  anode_atmosphere: "阳极气氛",
  cathode_flow: "阴极流量 (mL/min)",
  anode_flow: "阳极流量 (mL/min)",
  co_production_ml_min_cm2: "CO 产率 (mL·min⁻¹·cm⁻²)",
  faradaic_efficiency_percent: "法拉第效率 (%)",
  voltage_V: "电压 (V)",
  current_density_A_cm2: "电流密度 (A/cm²)",
  mode: "模式",
  setpoint: "设定值",
  duration_h: "时长 (h)",
  degradation_rate_per_h: "衰减率 (/h)",
};

/* 折叠摘要用的短标签 */
export const COND_SHORT = {
  atmosphere: "气氛",
  temperature_C: "温度",
  test_potential: "测试电位",
  cathode_atmosphere: "阴极气氛",
  anode_atmosphere: "阳极气氛",
  cathode_flow: "阴极流量",
  anode_flow: "阳极流量",
  mode: "模式",
};

/* 导出时尝试转 number 的字段（NR/空值保持字符串） */
export const NUMERIC = new Set([
  "electrolyte_thickness_um", "temperature_C", "polarization_resistance_Ohm_cm2",
  "electrode_area_cm2", "electrode_thickness_um", "buffer_layer_thickness_um",
  "cathode_flow", "anode_flow",
  "cathode_thickness_um", "anode_thickness_um",
  "buffer_layer_cathode_thickness_um", "buffer_layer_anode_thickness_um",
  "voltage_V", "current_density_A_cm2",
  "co_production_ml_min_cm2", "faradaic_efficiency_percent",
  "duration_h", "degradation_rate_per_h",
]);

/* 可启用记忆候选的文本字段 */
export const MEMORY_KEYS = new Set([
  "electrolyte", "buffer_layer", "buffer_layer_cathode", "buffer_layer_anode",
  "cathode", "anode", "current_collector",
  "atmosphere", "cathode_atmosphere", "anode_atmosphere",
  "cathode_flow", "anode_flow", "temperature_C",
  "synthesis_method", "composition", "modification_method",
]);

/* 硬枚举字段：只能选，不可自由输入（值为英文，电化学标准术语） */
export const ENUMS = {
  mode: ["galvanostatic", "potentiostatic"],
};

/* 必填规则 */
export const REQUIRED_KEYS = new Set(["doi", "sample_name"]);

/* 格式校验（非空时校验；doi 兼作必填） */
export const PATTERNS = {
  doi: { re: /^10\.\d{4,9}\/\S+$/, msg: "DOI 格式应类似 10.1016/j.xxx" },
  publication_date: { re: /^\d{4}-(0[1-9]|1[0-2])$/, msg: "格式应为 YYYY-MM" },
};

/* 记忆候选中忽略的值 */
export const MEMORY_IGNORE = new Set(["", "NR", "none"]);
