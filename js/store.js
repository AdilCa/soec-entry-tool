/* 状态容器：持有 state 与校验错误表，提供路径读写。渲染器无状态。 */
import { blankRoot } from "./schema.js";

export const store = {
  state: blankRoot(),
  errors: {}, // path -> message
  collapsed: new Set(), // 折叠的块路径（仅当前会话）
};

export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o[k], obj);
}

export function setPath(obj, path, val) {
  const ks = path.split(".");
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = val;
}

export function addAt(path, item) {
  getPath(store.state, path).push(item);
}

export function removeAt(path) {
  const ks = path.split(".");
  const idx = Number(ks.pop());
  getPath(store.state, ks.join(".")).splice(idx, 1);
}

export function resetState() {
  store.state = blankRoot();
  store.errors = {};
}

export function importState(json) {
  store.state = json;
  store.errors = {};
}

/* 生成当前 state 中所有可折叠块的路径（"全部折叠"用） */
export function allBlockPaths(state) {
  const paths = [];
  state.materials.forEach((m, mi) => {
    const mb = `materials.${mi}`;
    paths.push(mb);
    m.symmetric_cell.forEach((_, si) => paths.push(`${mb}.symmetric_cell.${si}`));
    m.single_cell.forEach((_, ci) => paths.push(`${mb}.single_cell.${ci}`));
  });
  return paths;
}
