const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const pubId = '2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8';
const exportUrl = `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=xlsx`;
const xlsxPath = path.join(__dirname, '../storage/temp/sheet_export.xlsx');
const extractDir = path.join(__dirname, '../storage/temp/xlsx_unzipped');

if (!fs.existsSync(path.dirname(xlsxPath))) {
  fs.mkdirSync(path.dirname(xlsxPath), { recursive: true });
}

function downloadXlsx(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Following redirect to: ${res.headers.location}`);
        return downloadXlsx(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', reject);
  });
}

async function extractSheetImages() {
  console.log(`Downloading published XLSX from: ${exportUrl}`);
  try {
    await downloadXlsx(exportUrl, xlsxPath);
    console.log(`Downloaded ${fs.statSync(xlsxPath).size} bytes to ${xlsxPath}`);

    // Unzip xlsx using python zipfile
    const pythonScript = `
import zipfile, os, json

with zipfile.ZipFile(r"${xlsxPath.replace(/\\/g, '/')}", 'r') as zip_ref:
    zip_ref.extractall(r"${extractDir.replace(/\\/g, '/')}")

media_dir = r"${path.join(extractDir, 'xl/media').replace(/\\/g, '/')}"
if os.path.exists(media_dir):
    files = os.listdir(media_dir)
    print(f"🎉 FOUND {len(files)} MEDIA/IMAGE FILES IN SPREADSHEET XLSX!")
    for f in files[:25]:
        print(f"  -> {f} ({os.path.getsize(os.path.join(media_dir, f))} bytes)")
else:
    print("No xl/media folder found in XLSX.")

# List all files inside the unzipped archive
print("\nAll files in unzipped XLSX:")
for root, dirs, fnames in os.walk(r"${extractDir.replace(/\\/g, '/')}"):
    for f in fnames:
        rel = os.path.relpath(os.path.join(root, f), r"${extractDir.replace(/\\/g, '/')}")
        print("  -", rel)
`;

    fs.writeFileSync(path.join(__dirname, '../storage/temp/unzip_xlsx.py'), pythonScript);
    const out = execSync('python storage/temp/unzip_xlsx.py', { cwd: path.join(__dirname, '..') }).toString();
    console.log(out);
  } catch (err) {
    console.error("Error downloading/extracting XLSX:", err.message);
  }
}

extractSheetImages();
