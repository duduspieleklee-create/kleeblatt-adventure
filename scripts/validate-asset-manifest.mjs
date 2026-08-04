import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "apps/web/public/assets/asset-manifest.json");

function validate() {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing asset manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const missing = [];

  for (const [group, files] of Object.entries(manifest)) {
    for (const file of files) {
      const absolute = path.join(process.cwd(), "apps/web/public/assets", group, file);
      if (!fs.existsSync(absolute)) {
        missing.push(absolute);
      }
    }
  }

  if (missing.length > 0) {
    console.error("Asset manifest references missing files:");
    for (const file of missing) {
      console.error(` - ${file}`);
    }
    process.exit(1);
  }

  const count = Object.values(manifest).flat().length;
  console.log(`Asset manifest valid: ${count} files referenced.`);
}

validate();
