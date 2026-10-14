const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'server/data/IIMJobsJobListing_2024-03-15.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`Total rows: ${data.length}`);
  console.log('Sample URLs (first 20):');
  
  data.slice(0, 20).forEach((row, i) => {
    console.log(`${i+1}: ${row.URL}`);
  });
  
  // Also check for any URL containing 'it'
  const itJobs = data.filter(r => r.URL && r.URL.toLowerCase().includes('it'));
  console.log(`\nJobs with 'it' in URL: ${itJobs.length}`);
  if (itJobs.length > 0) {
      console.log('Sample IT URL:', itJobs[0].URL);
  }

} catch (e) {
  console.error(e);
}
