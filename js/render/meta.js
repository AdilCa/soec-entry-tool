/* 文献信息区 */
import { field } from "./field.js";

export function renderMeta() {
  return `
  <div class="section">
    <div class="section-head"><h2>文献信息</h2></div>
    <div class="block"><div class="fields">
      ${field("doi", "doi", { required: true, ph: "10.xxxx/xxxxx" })}
      ${field("journal", "journal")}
      ${field("title", "title", { full: true })}
      ${field("publication_date", "publication_date", { ph: "YYYY-MM" })}
      ${field("authors", "authors", { ph: "第一作者; 通讯作者*" })}
      ${field("overall_notes", "overall_notes", { full: true, textarea: true })}
    </div></div>
  </div>`;
}
