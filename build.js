import fs from "fs";
import path from "path";

const sourceFile = path.join(process.cwd(), "./src/routes/+page.svelte");

const now = new Date();
const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
  2,
  "0"
)}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(
  2,
  "0"
)}${String(now.getMinutes()).padStart(2, "0")}${String(
  now.getSeconds()
).padStart(2, "0")}`;

fs.readFile(sourceFile, "utf-8", (err, content) => {
  if (err) throw err;

  const regex = /<div id="buildTimestamp">(.*?)<\/div>/;
  const updatedContent = content.replace(
    regex,
    `<div id="buildTimestamp">Build ver.${timestamp}</div>`
  );

  fs.writeFile(sourceFile, updatedContent, "utf-8", (err) => {
    if (err) throw err;
    console.log(`Build timestamp added to ${sourceFile}`);
  });
});
