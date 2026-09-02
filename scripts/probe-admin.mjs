const monthKey = process.argv[2] || '202605';
const url = `http://127.0.0.1:8787/api/admin/metrics?month=${monthKey}`;

try {
  const response = await fetch(url);
  const body = await response.text();
  console.log(`URL=${url}`);
  console.log(`STATUS=${response.status}`);
  console.log(body);
} catch (error) {
  console.error(error?.stack || String(error));
  process.exit(1);
}
