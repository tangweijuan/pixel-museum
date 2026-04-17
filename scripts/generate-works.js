const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const worksDir = path.join(rootDir, "assets", "works");
const outputPath = path.join(rootDir, "works.json");
const manifestPath = path.join(rootDir, "works.manifest.json");
const validExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthFolderPattern = /^\d{6}$/;

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function titleFromFilename(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function readMonthDirectories() {
  return fs
    .readdirSync(worksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function scanWorkFiles() {
  const monthDirs = readMonthDirectories();
  const scannedWorks = [];

  for (const monthDir of monthDirs) {
    if (!monthFolderPattern.test(monthDir)) {
      throw new Error(`Invalid month folder: ${monthDir}. Expected YYYYMM`);
    }

    const monthDirPath = path.join(worksDir, monthDir);
    const year = monthDir.slice(0, 4);
    const month = monthDir.slice(4, 6);
    const entries = fs
      .readdirSync(monthDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile());

    for (const entry of entries) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!validExtensions.has(ext)) {
        continue;
      }

      const relativeFile = `${monthDir}/${entry.name}`;
      const baseName = titleFromFilename(entry.name);
      const baseSlug = slugify(baseName) || "work";

      scannedWorks.push({
        defaultId: `${monthDir}-${baseSlug}`,
        file: relativeFile,
        defaultTitle: baseName,
        year,
        month,
      });
    }
  }

  return scannedWorks;
}

function readWorks() {
  if (!fs.existsSync(worksDir)) {
    fs.mkdirSync(worksDir, { recursive: true });
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error("Missing works.manifest.json");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const scannedWorks = scanWorkFiles();
  const works = [];
  const fileSet = new Set(scannedWorks.map((work) => work.file));
  const manifestEntriesByFile = new Map();

  for (const [id, metadata] of Object.entries(manifest)) {
    if (!metadata || typeof metadata !== "object") {
      throw new Error(`Manifest entry for ${id} must be an object`);
    }

    const { file, day, title, category, summary } = metadata;
    if (!file) {
      throw new Error(`Manifest entry for ${id} must include file`);
    }

    if (!fileSet.has(file)) {
      throw new Error(`Manifest entry for ${id} references missing file: ${file}`);
    }

    if (day !== undefined) {
      const normalizedDay = String(day).padStart(2, "0");
      if (!/^\d{2}$/.test(normalizedDay) || Number(normalizedDay) < 1 || Number(normalizedDay) > 31) {
        throw new Error(`Invalid day for ${id}: ${day}`);
      }
    }

    if (manifestEntriesByFile.has(file)) {
      throw new Error(`Duplicate manifest override for file: ${file}`);
    }

    manifestEntriesByFile.set(file, {
      id,
      day,
      title,
      category,
      summary,
    });
  }

  for (const scanned of scannedWorks) {
    const override = manifestEntriesByFile.get(scanned.file);
    const resolvedId = override?.id || scanned.defaultId;
    const resolvedDay = String(override?.day ?? "01").padStart(2, "0");
    const resolvedDate = `${scanned.year}-${scanned.month}-${resolvedDay}`;

    if (!datePattern.test(resolvedDate)) {
      throw new Error(`Invalid generated date for ${resolvedId}: ${resolvedDate}`);
    }

    works.push({
      id: resolvedId,
      src: `assets/works/${scanned.file}`,
      title: override?.title || scanned.defaultTitle,
      date: resolvedDate,
      category: override?.category || "其他",
      summary: override?.summary || "",
    });
  }

  works.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return a.id.localeCompare(b.id);
  });

  return works;
}

function writeWorksFile(works) {
  fs.writeFileSync(outputPath, JSON.stringify(works, null, 2) + "\n", "utf8");
}

function main() {
  const works = readWorks();
  writeWorksFile(works);
  console.log(`Generated works.json with ${works.length} work(s).`);
}

main();
