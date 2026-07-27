// Server-side port of the browser parseSalRet() logic.
// Parses the monthly "Sal to Ret" matrix: people x brand-allocation + salary.
const XLSX = require("xlsx");

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function parseSalRet(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  let aoa = null, sheet = "", headerRowIdx = -1;
  const ordered = [...wb.SheetNames].sort(
    (a, b) =>
      (/sal.*ret|ret.*sal/i.test(b) ? 1 : 0) -
      (/sal.*ret|ret.*sal/i.test(a) ? 1 : 0),
  );
  for (const n of ordered) {
    const a = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null });
    const idx = a.findIndex((r) => r && r.some((c) => c && norm(String(c)).includes("employeename")));
    if (idx >= 0) { aoa = a; sheet = n; headerRowIdx = idx; break; }
  }
  if (!aoa) return null;

  const header = aoa[headerRowIdx].map((c) => (c == null ? "" : String(c).trim()));
  const findCol = (pred) => header.findIndex((h) => pred(norm(h)));
  const iName = findCol((h) => h.includes("employeename") || h === "name");
  const iSalary = findCol((h) => h === "salary" || h.includes("salary") || h.includes("ctc"));
  const iDesig = findCol((h) => h.includes("designation") || h.includes("role"));
  const iTotal = header.findIndex((h) => norm(h) === "total");
  if (iName < 0 || iSalary < 0) return null;

  const start = iSalary + 1;
  const end = iTotal > start ? iTotal : header.length;
  const brandCols = [];
  for (let c = start; c < end; c++) {
    const h = header[c];
    if (h && !/^total$|bandwidth/i.test(h.trim())) brandCols.push({ c, name: h.trim() });
  }
  const brands = brandCols.map((b) => b.name);

  const employees = [];
  let central = 0, sumFull = 0, salRow = null, retRow = null;
  for (let r = headerRowIdx + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row) continue;
    const labels = row.map((c) => (c != null ? norm(String(c)) : ""));
    if (labels.includes("totalsalary")) salRow = row;
    if (labels.includes("totalretainer")) retRow = row;
    const name = row[iName];
    if (!name || typeof name !== "string") continue;
    const nn = norm(name);
    if (nn === "central") { central = Number(row[iSalary]) || 0; continue; }
    if (nn.startsWith("total") || nn.startsWith("salarytoretainer")) continue;
    const salary = Number(row[iSalary]) || 0;
    if (!salary) continue;
    const alloc = {};
    for (const bc of brandCols) {
      const v = Number(row[bc.c]);
      if (v && v > 0) alloc[bc.name] = v;
    }
    sumFull += salary;
    employees.push({
      name: name.trim(),
      desig: iDesig >= 0 && row[iDesig] ? String(row[iDesig]).trim() : "",
      salary,
      alloc,
    });
  }

  const salaryCost = {};
  brands.forEach((b) => (salaryCost[b] = 0));
  employees.forEach((e) => {
    for (const b in e.alloc) salaryCost[b] += e.salary * e.alloc[b];
  });

  let retainer = {};
  if (retRow) brandCols.forEach((bc) => { const v = Number(retRow[bc.c]); if (v > 0) retainer[bc.name] = v; });

  const grandSalary = salRow ? (Number(salRow[iSalary]) || sumFull + central) : sumFull + central;

  let month = "";
  const first = aoa[0] && aoa[0][0];
  if (first instanceof Date) month = first.toISOString().slice(0, 7);

  return { sheet, month, brands, employees, salaryCost, retainer, central, grandSalary };
}

module.exports = { parseSalRet };