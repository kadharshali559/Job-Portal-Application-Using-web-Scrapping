const axios = require('axios');

async function testCompanyAPI() {
  try {
    // Pick a company that likely has IIMJobs data
    const company = 'Genpact'; // Adjust if needed
    console.log(`Fetching data for company: ${company}...\n`);
    
    const response = await axios.get(`http://localhost:5001/api/companies/${company}`);
    const data = response.data;
    
    console.log(`Company: ${data.name}`);
    console.log(`Job Count: ${data.jobCount}`);
    
    // Separate by source
    const naukriJobs = data.jobs.filter(j => j.source === 'Naukri');
    const iimJobs = data.jobs.filter(j => j.source === 'IIMJobs');
    
    console.log(`\nNaukri Jobs: ${naukriJobs.length}`);
    console.log(`IIMJobs: ${iimJobs.length}`);
    
    if (iimJobs.length > 0) {
      console.log('\n--- FIRST IIM JOB ---');
      console.log(iimJobs[0]);
    } else {
        console.log('\nNO IIM JOBS FOUND FOR THIS COMPANY! Trying to find any IIM job...');
        // Find any job with IIM source
        const allJobs = data.jobs;
        const anyIim = allJobs.find(j => j.source === 'IIMJobs' || j.source === 'iimjobs');
        if (anyIim) {
            console.log('Found one:', anyIim);
        } else {
             // Debug the source values of proper IIM jobs
             console.log('\nDumping job sources to debug:');
             allJobs.slice(0, 10).forEach(j => console.log(`- Source: ${j.source}, ApplyURL: ${j.applyUrl ? 'Present' : 'MISSING'}`));
        }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCompanyAPI();
