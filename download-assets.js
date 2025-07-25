
const fs = require("fs");
const https = require("https");
const path = require("path");

const inputFile = "glitch-assets.jsonl";
const outputDir = path.join(__dirname, "assets");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const lines = fs.readFileSync(inputFile, "utf-8").split("\n");

const downloads = [];

lines.forEach(line => {
  try {
    const entry = JSON.parse(line);

    // Skip deleted files or entries with no URL
    if (entry.deleted || !entry.url || !entry.name) return;

    const filePath = path.join(outputDir, entry.name);
    const file = fs.createWriteStream(filePath);

    console.log(`Downloading: ${entry.name} ...`);

    downloads.push(
      new Promise((resolve, reject) => {
        https.get(entry.url, response => {
          response.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
        }).on("error", err => {
          fs.unlinkSync(filePath);
          console.error(`Failed to download ${entry.name}: ${err.message}`);
          reject(err);
        });
      })
    );
  } catch (err) {
    // Skip malformed lines
  }
});

Promise.all(downloads).then(() => {
  console.log("✅ All assets downloaded to ./assets/");
});