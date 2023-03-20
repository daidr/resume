import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const icons = {};

const files = await fs.readdir(join(__dirname, "../assets/icons"));

for (const file of files) {
  const name = file.replace(".svg", "");
  icons[name] = await fs.readFile(
    join(__dirname, "../assets/icons", file),
    "utf8"
  );
}

export default icons;
