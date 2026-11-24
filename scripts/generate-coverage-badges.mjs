import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`FALHA: ${message}`);
  process.exit(1);
}

function positiveCount(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) fail(`${label} inválido: ${value}`);
  return parsed;
}

function frontendCounters(file) {
  if (!fs.existsSync(file)) fail(`relatório Vitest ausente: ${file}`);
  const summary = JSON.parse(fs.readFileSync(file, "utf8"));
  const total = summary.total;
  if (!total?.lines || !total?.branches) fail("coverage-summary.json não contém lines e branches");
  return {
    lines: {
      covered: positiveCount(total.lines.covered, "frontend lines covered"),
      total: positiveCount(total.lines.total, "frontend lines total"),
    },
    branches: {
      covered: positiveCount(total.branches.covered, "frontend branches covered"),
      total: positiveCount(total.branches.total, "frontend branches total"),
    },
  };
}

function backendCounters(file) {
  if (!fs.existsSync(file)) fail(`relatório JaCoCo ausente: ${file}`);
  const rows = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  if (rows.length < 2) fail("jacoco.csv não contém dados de cobertura");
  const header = rows[0].split(",");
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));
  const required = ["LINE_MISSED", "LINE_COVERED", "BRANCH_MISSED", "BRANCH_COVERED"];
  for (const name of required) {
    if (indexes[name] === undefined) fail(`jacoco.csv não contém ${name}`);
  }

  const totals = { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } };
  for (const row of rows.slice(1)) {
    if (!row.trim()) continue;
    const fields = row.split(",");
    const lineMissed = positiveCount(fields[indexes.LINE_MISSED], "backend lines missed");
    const lineCovered = positiveCount(fields[indexes.LINE_COVERED], "backend lines covered");
    const branchMissed = positiveCount(fields[indexes.BRANCH_MISSED], "backend branches missed");
    const branchCovered = positiveCount(fields[indexes.BRANCH_COVERED], "backend branches covered");
    totals.lines.covered += lineCovered;
    totals.lines.total += lineCovered + lineMissed;
    totals.branches.covered += branchCovered;
    totals.branches.total += branchCovered + branchMissed;
  }
  return totals;
}

function metric(frontend, backend, name) {
  const covered = frontend[name].covered + backend[name].covered;
  const total = frontend[name].total + backend[name].total;
  if (total <= 0 || covered > total) fail(`total consolidado de ${name} é inválido`);
  return { covered, total, percentage: Math.round((covered * 1000) / total) / 10 };
}

function color(percentage) {
  if (percentage >= 90) return "4c1";
  if (percentage >= 80) return "97ca00";
  if (percentage >= 70) return "dfb317";
  if (percentage >= 60) return "fe7d37";
  return "e05d44";
}

function badge(label, value, badgeColor) {
  if (!/^[a-z ]+$/.test(label) || !/^\d+(?:\.\d)?%$/.test(value) || !/^[a-f0-9]+$/.test(badgeColor)) {
    fail("conteúdo inválido para o SVG de cobertura");
  }
  const left = 112;
  const right = 52;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}: ${value}" width="${left + right}" height="20"><title>${label}: ${value}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${left + right}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${left}" height="20" fill="#555"/><rect x="${left}" width="${right}" height="20" fill="#${badgeColor}"/><rect width="${left + right}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${left / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text><text x="${left / 2}" y="14">${label}</text><text x="${left + right / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text><text x="${left + right / 2}" y="14">${value}</text></g></svg>\n`;
}

const [frontendFile, backendFile, outputDir] = process.argv.slice(2);
if (!frontendFile || !backendFile || !outputDir) {
  fail("uso: node generate-coverage-badges.mjs <coverage-summary.json> <jacoco.csv> <output-dir>");
}

const frontend = frontendCounters(frontendFile);
const backend = backendCounters(backendFile);
const lines = metric(frontend, backend, "lines");
const branches = metric(frontend, backend, "branches");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "coverage-lines.svg"), badge("coverage lines", `${lines.percentage}%`, color(lines.percentage)));
fs.writeFileSync(path.join(outputDir, "coverage-branches.svg"), badge("coverage branches", `${branches.percentage}%`, color(branches.percentage)));
fs.writeFileSync(path.join(outputDir, "coverage.json"), `${JSON.stringify({ lines, branches }, null, 2)}\n`);
console.log(`Cobertura consolidada: lines=${lines.percentage}% branches=${branches.percentage}%`);
