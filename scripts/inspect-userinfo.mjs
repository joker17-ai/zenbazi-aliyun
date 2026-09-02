import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const monthKey = process.argv[2] || '202605';
const filePath = path.join('D:/ZenBazi/cloud/userinfo', `${monthKey}.xlsx`);
const outputPath = path.join('D:/ZenBazi', `.tmp_userinfo_${monthKey}.json`);

const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

fs.writeFileSync(outputPath, JSON.stringify({
  monthKey,
  filePath,
  count: rows.length,
  sample: rows.slice(0, 5)
}, null, 2));
