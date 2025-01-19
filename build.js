import fs from "fs";
import path from "path";

const packageFile = path.join(process.cwd(), "./package.json");
const layoutFile = path.join(process.cwd(), "./src/routes/+layout.svelte");
const manifestFile = path.join(process.cwd(), "./static/manifest.json");

const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
const version = packageJson.version;

// Create UTC Timestamp
const now = new Date();
const timestamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(
  2,
  "0"
)}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(
  2,
  "0"
)}${String(now.getUTCMinutes()).padStart(2, "0")}${String(
  now.getUTCSeconds()
).padStart(2, "0")}`;

// Update manifest.json
fs.readFile(manifestFile, "utf-8", (err, content) => {
  if (err) throw err;
  
  const manifestJson = JSON.parse(content);
  manifestJson.version = version;
  
  fs.writeFile(manifestFile, JSON.stringify(manifestJson, null, 2), "utf-8", (err) => {
    if (err) throw err;
    console.log(`Version ${version} updated in ${manifestFile}`);
  });
});

// Update layout.svelte(Header)
fs.readFile(layoutFile, "utf-8", (err, content) => {
  if (err) throw err;
  
  const regex = /\<div id="buildTimestamp" class="text-xs"\>(.*?)\<\/div\>/;
  const updatedContent = content.replace(
    regex,
    `<div id="buildTimestamp" class="text-xs">v${version} (Build: ${timestamp} UTC)</div>`
  );
  
  fs.writeFile(layoutFile, updatedContent, "utf-8", (err) => {
    if (err) throw err;
    console.log(`Version ${version} and UTC build timestamp added to ${layoutFile}`);
  });
});