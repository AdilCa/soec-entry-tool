/* 唯一的"知识中心"：标签、数值字段、必填、枚举、可记忆字段、数据表列定义。
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
  buffer_layer: "缓冲层",
  cathode: "阴极",
  buffer_layer_cathode: "阴极缓冲层",
  buffer_layer_anode: "阳极缓冲层",
  anode: "阳极",
  atmosphere: "气氛",
  cathode_atmosphere: "阴极气氛",
  anode_atmosphere: "阳极气氛",
  temperature_C: "温度 (°C)",
  polarization_resistance_Ohm_cm2: "极化电阻 (Ω·cm²)",
  voltage_V: "电压 (V)",
  current_density_A_cm2: "电流密度 (A/cm²)",
  mode: "模式",
  setpoint: "设定值",
  duration_h: "时长 (h)",
  degradation_rate_per_h: "衰减率 (/h)",
};

/* 数据表：cols 为列顺序（也是粘贴时的列顺序）；
   carry 为条件列——新增行（含粘贴扩出的行）沿用上一行的值 */
export const TABLES = {
  symRow: {
    cols: ["atmosphere", "temperature_C", "polarization_resistance_Ohm_cm2"],
    carry: ["atmosphere", "temperature_C"],
  },
  scRow: {
    cols: ["cathode_atmosphere", "anode_atmosphere", "temperature_C", "voltage_V", "current_density_A_cm2"],
    carry: ["cathode_atmosphere", "anode_atmosphere", "temperature_C"],
  },
  stabRow: {
    cols: [
      "cathode_atmosphere", "anode_atmosphere", "temperature_C",
      "mode", "setpoint", "duration_h", "degradation_rate_per_h",
    ],
    carry: ["cathode_atmosphere", "anode_atmosphere", "temperature_C", "mode"],
  },
};

/* 单电池结构层（构型链顺序） */
export const SC_LAYERS = ["cathode", "buffer_layer_cathode", "electrolyte", "buffer_layer_anode", "anode"];
export const SYM_LAYERS = ["electrolyte", "buffer_layer"];

/* 导出时尝试转 number 的字段（NR/空值保持字符串） */
export const NUMERIC = new Set([
  "temperature_C", "polarization_resistance_Ohm_cm2",
  "voltage_V", "current_density_A_cm2",
  "duration_h", "degradation_rate_per_h",
]);

/* 可启用记忆候选的文本字段 */
export const MEMORY_KEYS = new Set([
  "electrolyte", "buffer_layer", "buffer_layer_cathode", "buffer_layer_anode",
  "cathode", "anode",
  "atmosphere", "cathode_atmosphere", "anode_atmosphere", "temperature_C",
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
