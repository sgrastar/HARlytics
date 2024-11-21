import fs from "fs";
import path from "path";

// package.jsonとソースファイルのパスを設定
const packageFile = path.join(process.cwd(), "./package.json");
const layoutFile = path.join(process.cwd(), "./src/routes/+layout.svelte");

// package.jsonを読み込んでバージョンを取得
const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
const version = packageJson.version;

// UTCタイムスタンプを生成
const now = new Date();
const timestamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(
  2,
  "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(
  2,
  "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(
  now.getUTCSeconds()
).padStart(2, "0")}`;

// レイアウトファイルを読み込んで更新
fs.readFile(layoutFile, "utf-8", (err, content) => {
  if (err) throw err;

  const regex = /<div id="buildTimestamp">(.*?)<\/div>/;
  const updatedContent = content.replace(
    regex,
    `<div id="buildTimestamp" class="text-xs">v${version} (Build: ${timestamp} UTC)</div>`
  );

  fs.writeFile(layoutFile, updatedContent, "utf-8", (err) => {
    if (err) throw err;
    console.log(`Version ${version} and UTC build timestamp added to ${layoutFile}`);
  });
});