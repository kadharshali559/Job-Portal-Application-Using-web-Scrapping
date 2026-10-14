const axios = require('axios');

async function testAPI() {
  try {
    console.log('Fetching jobs from API...\n');
    const response = await axios.get('http://localhost:5001/api/jobs');
    const jobs = response.data;
    
    console.log(`Total jobs received: ${jobs.length}\n`);
    
    // Get first 5 jobs
    const firstFive = jobs.slice(0, 5);
    
    console.log('='*70);
    console.log('FIRST 5 JOBS API RESPONSE:');
    console.log('='*70);
    
    firstFive.forEach((job, index) => {
      console.log(`\n--- Job ${index + 1} ---`);
      console.log(`Title: ${job.title}`);
      console.log(`Company: ${job.company}`);
      console.log(`applyUrl: ${job.applyUrl}`);
      console.log(`naukriUrl: ${job.naukriUrl}`);
      console.log(`companyApplyUrl: ${job.companyApplyUrl}`);
      console.log(`hasDirectLink: ${job.hasDirectLink}`);
    });
    
    // Check how many have valid applyUrl
    const withUrl = jobs.filter(j => j.applyUrl).length;
    const withoutUrl = jobs.filter(j => !j.applyUrl).length;
    
    console.log('\n' + '='*70);
    console.log('SUMMARY:');
    console.log('='*70);
    console.log(`Jobs with applyUrl: ${withUrl}`);
    console.log(`Jobs without applyUrl: ${withoutUrl}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
