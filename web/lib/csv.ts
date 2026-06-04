// downloadCSV — array of rows → ดาวน์โหลด CSV (client-side)
//   escape quote/comma/newline + BOM (﻿) ให้ Excel/Google Sheets อ่านภาษาไทยถูก
export function downloadCSV(name: string, rows: (string | number | null)[][]) {
  const csv = rows
    .map((r) => r.map((c) => { const s = c == null ? "" : "" + c; return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
