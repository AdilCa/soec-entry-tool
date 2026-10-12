/* 渲染调度：拼装各分区。所有渲染器无状态，只读 store。 */
import { renderMeta } from "./meta.js";
import { renderMaterials } from "./material.js";

export function renderForm() {
  document.getElementById("form").innerHTML = renderMeta() + renderMaterials();
}
