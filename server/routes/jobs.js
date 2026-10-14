const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Load jobs data from all Excel files in the data directory
function loadJobsData() {
  // Check multiple data directories
  const dataDirs = [
    path.join(__dirname, '../data'),  // server/data
    // Removed IIMJobs path as requested
    path.join(__dirname, '../../data'),  // fallback
  ];
  
  let allJobs = [];
  
  // Read from all directories that exist
  dataDirs.forEach(dataDir => {
    if (!fs.existsSync(dataDir)) {
      return; // Skip if directory doesn't exist
    }
    
    // Filter out IIMJobs files explicitly if they exist in other dirs
    const files = fs.readdirSync(dataDir).filter(f => 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$') &&
      !f.toLowerCase().includes('iimjob') // Explicitly exclude IIM files
    );
    
    if (files.length === 0) {
      return; // Skip if no Excel files
    }
    
    // Read and merge all Excel files from this directory
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        // Post-process data to fix missing fields
        const processedData = data.map(job => {
          // Fix missing Company
          if (!job.Company && job['Job Title'] && job['Job Title'].includes(' - ')) {
            const parts = job['Job Title'].split(' - ');
            job.Company = parts[0].trim();
          }
          
          return job;
        });

        const jobs = processedData.map((job, index) => {
          // DEBUG: Log first job to see what we're getting
          if (index === 0) {
            console.log('=== FIRST JOB FROM EXCEL ===');
            console.log('Excel columns:', Object.keys(job));
            console.log('Full job object:', job);
            console.log('Company Apply URL value:', job['Company Apply URL']);
            console.log('===========================');
          }
          
          // Infer source from filename if missing (for legacy data)
          const source = job.Source || (file.toLowerCase().includes('iimjobs') ? 'IIMJobs' : (file.toLowerCase().includes('naukri') ? 'Naukri' : 'Unknown'));
          
        const companyApplyUrl = job['Company Apply URL'] || null;
        const naukriUrl = job['Naukri URL'] || job['URL'] || null;
        const applyUrlFromFastScraper = job['Apply URL'] || null;
        
        // DEBUG: Log URL extraction for first job from each file
        if (index === 0) {
          console.log(`\n=== FIRST JOB FROM ${file} ===`);
          console.log('Excel columns:', Object.keys(job));
          console.log('Company Apply URL:', companyApplyUrl);
          console.log('Naukri URL:', naukriUrl);
          console.log('Apply URL (new):', applyUrlFromFastScraper);
        }
        
        const jobObject = {
        id: `${file}-${index}`,
        title: job['Job Title'],
        description: job.Description || null,
        experience: job['Experience Reqd'],
        company: job.Company,
        location: job.City,
        salary: job['Salary Range'] || 'Not Mentioned',
        datePosted: job['Date Posted'],
        // Handle both old and new data formats
        naukriUrl,
        companyApplyUrl,
        // Priority: Company Apply URL > Fast Scraper Apply URL > Naukri URL
        // This ensures all scrapers work correctly
        applyUrl: companyApplyUrl || applyUrlFromFastScraper || naukriUrl,
        hasDirectLink: !!companyApplyUrl,
        source: source,
          // Infer category from URL or Title if missing (for legacy data)
          category: job.Category || (function() {
            const text = ((job.URL || job['Naukri URL'] || '') + ' ' + (job['Job Title'] || '')).toLowerCase();
            
            // IT & Technology
            if (text.includes('it-systems') || text.includes('technology') || text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('java') || text.includes('react') || text.includes('node') || text.includes('full stack') || text.includes('backend') || text.includes('frontend') || text.includes('data scientist') || text.includes('cloud') || text.includes('devops') || text.includes('technical')) return 'it';
            
            // Banking & Finance
            if (text.includes('banking') || text.includes('finance') || text.includes('credit') || text.includes('risk') || text.includes('audit') || text.includes('tax') || text.includes('accountant') || text.includes('wealth') || text.includes('investment') || text.includes('equity') || text.includes('treasury') || text.includes('ca')) return 'banking';
            
            // Sales & Marketing
            if (text.includes('sales') || text.includes('marketing') || text.includes('business development') || text.includes('account manager') || text.includes('client') || text.includes('brand') || text.includes('digital') || text.includes('growth')) return 'sales';
            
            // Consulting
            if (text.includes('consulting') || text.includes('strategy') || text.includes('advisory') || text.includes('consultant')) return 'consulting';
            
            // HR
            if (text.includes('hr') || text.includes('human resources') || text.includes('recruitment') || text.includes('talent') || text.includes('hiring') || text.includes('learning')) return 'hr';
            
            // Operations
            if (text.includes('operations') || text.includes('supply chain') || text.includes('logistics') || text.includes('procurement') || text.includes('plant') || text.includes('manufacturing')) return 'operations';
            
            // Legal
            if (text.includes('legal') || text.includes('lawyer') || text.includes('counsel') || text.includes('regulatory') || text.includes('compliance')) return 'legal';
            
            // BPO
            if (text.includes('bpo') || text.includes('kpo') || text.includes('call center') || text.includes('customer service') || text.includes('customer support')) return 'bpo';
            
            // Management
            if (text.includes('management') || text.includes('manager') || text.includes('head') || text.includes('director') || text.includes('chief') || text.includes('vp') || text.includes('gm')) return 'management';
            
            return 'others';
          })()
        };
        
        // DEBUG: Log URL for first job
        if (index === 0) {
          console.log('Final applyUrl for first job:', jobObject.applyUrl);
        }
        
        return jobObject;
        });
        
        allJobs = allJobs.concat(jobs);
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    });
  });
  
  return allJobs;
}

// GET /api/jobs - Get all jobs with optional filters
router.get('/', (req, res) => {
  try {
    let jobs = loadJobsData();
    const { company, location, search } = req.query;
    
    if (company) {
      jobs = jobs.filter(job => 
        job.company && job.company.toLowerCase().includes(company.toLowerCase())
      );
    }
    
    if (location) {
      jobs = jobs.filter(job => 
        job.location && job.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(job => 
        (job.title && job.title.toLowerCase().includes(searchLower)) ||
        (job.description && job.description.toLowerCase().includes(searchLower)) ||
        (job.company && job.company.toLowerCase().includes(searchLower))
      );
    }
    
    res.json(jobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// GET /api/jobs/matched - Get jobs matching user skills
router.get('/matched', (req, res) => {
  try {
    const { skills } = req.query;
    
    if (!skills) {
      return res.json(loadJobsData().slice(0, 20));
    }
    
    const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
    let jobs = loadJobsData();
    
    // Score jobs based on skill matches
    const scoredJobs = jobs.map(job => {
      let score = 0;
      const jobText = `${job.title} ${job.description}`.toLowerCase();
      
      skillsArray.forEach(skill => {
        if (jobText.includes(skill)) {
          score++;
        }
      });
      
      return { ...job, matchScore: score };
    });
    
    // Filter and sort by match score
    const matchedJobs = scoredJobs
      .filter(job => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    res.json(matchedJobs.length > 0 ? matchedJobs : loadJobsData().slice(0, 20));
  } catch (error) {
    console.error('Error finding matched jobs:', error);
    res.status(500).json({ error: 'Failed to find matched jobs' });
  }
});

// TEST ENDPOINT: Get first job with company link
router.get('/test-company-link', (req, res) => {
  try {
    const jobs = loadJobsData();
    const jobWithCompanyLink = jobs.find(job => job.companyApplyUrl);
    
    if (jobWithCompanyLink) {
      res.json({
        success: true,
        job: jobWithCompanyLink
      });
    } else {
      res.json({
        success: false,
        message: 'No jobs with company apply URL found',
        totalJobs: jobs.length
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
