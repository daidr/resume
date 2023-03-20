import { promises as fs, watch, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { generateMarkdown, generateMarkdownInline } from "./utils/markdown.js";
import icons from "./utils/icons.js";
import { CONFIG } from "./config.js";
import { debounce, emptyDir } from "./utils/_.js";
import { minify } from "html-minifier";

const __dirname = dirname(fileURLToPath(import.meta.url));

const img2data = (buffer) => {
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

const getInlineImage = (imagePath) => {
  const imageData = readFileSync(
    join(__dirname, "assets", "images", imagePath)
  );
  return img2data(imageData);
};

const templateEntry = join(__dirname, "templates", "index.ejs");

const outputRoot = join(__dirname, "dist");

const generateSpecifiedFile = async (locale, compress) => {
  console.log(`[构建] 准备生成 ${locale} 版本`);

  // 获取文件路径
  const localePath = join(__dirname, "locales", `${locale}.json`);
  // 读取文件内容
  const localeData = await fs.readFile(localePath, "utf8");

  // 构建模板上下文
  const context = {
    generateMarkdown,
    getInlineImage,
    generateMarkdownInline,
    i18n: {
      currentLanguage: locale,
    },
    content: JSON.parse(localeData),
    icons,
  };

  // 渲染HTML
  let final = await new Promise((resolve, reject) => {
    ejs.renderFile(templateEntry, context, {}, (err, str) => {
      if (err) {
        reject(err);
      } else {
        resolve(str);
      }
    });
  });

  // 压缩
  if (compress) {
    console.log(`[构建] 压缩中...`);
    final = minify(final, {
      minifyCSS: true,
      preserveLineBreaks: true,
      minifyURLs: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      collapseBooleanAttributes: true,
    });
  }

  // 写入文件
  await fs.writeFile(join(outputRoot, `${locale}.html`), final);

  if (locale === CONFIG.fallbackLanguage) {
    await fs.writeFile(join(outputRoot, `index.html`), final);
  }

  console.log(`[构建] ${locale} 版本生成成功`);
};

const generate = async (compress) => {
  console.log("[构建] 准备开始构建...");
  // 获取所有locales
  const locales = (await fs.readdir(join(__dirname, "locales")))
    .filter((file) => !file.startsWith("$"))
    .map((file) => {
      const [locale] = file.split(".");
      return locale;
    });

  // 生成所有文件
  await Promise.all(
    locales.map((locale) => generateSpecifiedFile(locale, compress))
  );

  console.log("[构建] 构建全部完成!");
};

(async () => {
  const [command] = process.argv.slice(2);
  if (command === "dev") {
    await generate();

    // 监听 locales 文件变化
    watch(
      join(__dirname, "locales"),
      { recursive: true },
      debounce(async (event, filename) => {
        if (filename.startsWith("$")) return;
        if (event === "change") {
          const fileName = filename.split(".")[0];
          console.log(`[DEV] 准备重新生成 ${fileName}`);
          await generateSpecifiedFile(fileName);
          console.log(`[DEV] ${fileName} 重新生成完成`);
        } else if (event === "rename") {
          generate();
        }
      }, 100)
    );

    // 监听 templates 文件变化
    watch(
      join(__dirname, "templates"),
      {
        recursive: true,
      },
      debounce(() => {
        generate();
      }, 100)
    );
    console.log("[DEV] 监听文件变化中...");
  } else {
    await emptyDir(outputRoot);
    await generate(true);
  }
})();
