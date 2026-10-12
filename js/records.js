/* 界面状态（按材料 / 电池分组）⇄ 导出格式（扁平记录）的双向转换。
   导出：每个数据点一条完整记录，通过 sample_name 关联 materials。
   导入：按 sample_name + 电池结构重新分组还原为界面状态。 */
import { TABLES, SC_LAYERS, SYM_LAYERS } from "./config.js";
import { blankMaterial, blankRoot } from "./schema.js";

const META_KEYS = ["doi", "title", "journal", "publication_date", "authors", "overall_notes"];
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? ""]));

export function toRecords(state) {
  const out = pick(state, META_KEYS);
  out.materials = [];
  out.symmetric_cell_records = [];
  out.single_cell_records = [];
  out.stability_records = [];

  state.materials.forEach((m) => {
    const sample_name = m.sample_name.trim();
    out.materials.push({
      sample_name,
      composition: m.composition.map((c) => c.trim()).filter(Boolean),
      synthesis_method: m.synthesis_method,
      modification_method: m.modification_method,
    });
    m.symmetric_cell.forEach((s) => {
      const head = { sample_name, ...pick(s, SYM_LAYERS) };
      s.measurements.forEach((r) =>
        out.symmetric_cell_records.push({ ...head, ...pick(r, TABLES.symRow.cols) })
      );
    });
    m.single_cell.forEach((c) => {
      const head = { sample_name, ...pick(c, SC_LAYERS) };
      c.measurements.forEach((r) =>
        out.single_cell_records.push({ ...head, ...pick(r, TABLES.scRow.cols) })
      );
      c.stability.forEach((r) =>
        out.stability_records.push({ ...head, ...pick(r, TABLES.stabRow.cols) })
      );
    });
  });
  return out;
}

export const isRecordsFormat = (j) =>
  j && typeof j === "object" && !Array.isArray(j) &&
  Array.isArray(j.materials) &&
  ["symmetric_cell_records", "single_cell_records", "stability_records"].some((k) => k in j);

/* 输入框只处理字符串：导出时转成的 number 在这里转回 */
const str = (v) => (v === undefined || v === null ? "" : String(v));
const strAll = (obj, keys) => Object.fromEntries(keys.map((k) => [k, str(obj[k])]));

export function fromRecords(j) {
  const state = { ...blankRoot(), ...strAll(j, META_KEYS), materials: [] };
  const byName = new Map();
  const material = (name) => {
    if (!byName.has(name)) {
      const m = { ...blankMaterial(), sample_name: name };
      byName.set(name, m);
      state.materials.push(m);
    }
    return byName.get(name);
  };

  j.materials.forEach((m) => {
    const t = material(str(m.sample_name));
    t.composition = Array.isArray(m.composition) && m.composition.length ? m.composition.map(str) : [""];
    t.synthesis_method = str(m.synthesis_method);
    t.modification_method = str(m.modification_method);
  });

  /* 同一材料下结构完全相同的记录归为同一组电池 */
  const groupInto = (list, layers, rec) => {
    const head = strAll(rec, layers);
    const sig = JSON.stringify(head);
    let cell = list.find((c) => c._sig === sig);
    if (!cell) {
      cell = { ...head, _sig: sig, measurements: [], stability: [] };
      list.push(cell);
    }
    return cell;
  };

  (j.symmetric_cell_records || []).forEach((r) => {
    const cell = groupInto(material(str(r.sample_name)).symmetric_cell, SYM_LAYERS, r);
    cell.measurements.push(strAll(r, TABLES.symRow.cols));
  });
  (j.single_cell_records || []).forEach((r) => {
    const cell = groupInto(material(str(r.sample_name)).single_cell, SC_LAYERS, r);
    cell.measurements.push(strAll(r, TABLES.scRow.cols));
  });
  (j.stability_records || []).forEach((r) => {
    const cell = groupInto(material(str(r.sample_name)).single_cell, SC_LAYERS, r);
    cell.stability.push(strAll(r, TABLES.stabRow.cols));
  });

  state.materials.forEach((m) => {
    m.symmetric_cell.forEach((c) => { delete c._sig; delete c.stability; });
    m.single_cell.forEach((c) => delete c._sig);
  });
  if (!state.materials.length) state.materials.push(blankMaterial());
  return state;
}
