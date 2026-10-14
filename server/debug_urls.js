const xlsx = require('xlsx');
const path = require('path');

// Correct path to legacy file
const filePath = 'C:/Users/Dell/Desktop/web-scraping-naukri-main/web-scraping-naukri-main/web-scraping-iimjobs-main/web-scraping-iimjobs-main/data/IIMJobsJobListing_2024-03-15.xlsx';
console.log('Reading file:', filePath);

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`Total rows: ${data.length}`);
  
  // IT jobs check
  const itKeywords = ['it-systems', 'technology'];
  
  const itJobs = data.filter(r => {
      const url = (r.URL || '').toLowerCase();
      return url.includes('it-systems');
  });

  console.log(`\nJobs with 'it-systems' in URL: ${itJobs.length}`);
  if (itJobs.length > 0) {
      console.log('Sample IT URL:', itJobs[0].URL);
  } else {
      console.log('No jobs found with it-systems in URL. Dumping sample URLs to check pattern:');
      data.slice(0, 20).forEach(r => console.log(r.URL));
  }

} catch (e) {
  console.error(e);
}
