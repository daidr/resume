import { join } from "path";
import { promises as fs } from "fs";

export const debounce = (fn, delay) => {
  let timer = null;
  return function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
};

export const emptyDir = async (path) => {
  // 如果文件夹不存在，先创建
  if (!(await fs.access(path).catch(() => false))) {
    await fs.mkdir(path, { recursive: true });
  }
  const files = await fs.readdir(path);
  for (let file of files) {
    const filePath = join(path, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await emptyDir(filePath);
    } else {
      await fs.unlink(filePath);
    }
  }
};
