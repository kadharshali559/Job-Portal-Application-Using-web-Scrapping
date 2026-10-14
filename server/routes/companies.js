const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Load jobs data from all Excel files in multiple data directories
function loadJobsData() {
  const dataDirs = [
    path.join(__dirname, '../data'),
    // Removed IIMJobs path as requested
    path.join(__dirname, '../../data'),
  ];
  
  let allJobs = [];
  
  dataDirs.forEach(dataDir => {
    if (!fs.existsSync(dataDir)) {
      return;
    }
    
    // Filter out IIMJobs files explicitly if they exist in other dirs
    const files = fs.readdirSync(dataDir).filter(f => 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$') && 
      !f.toLowerCase().includes('iimjob') // Explicitly exclude IIM files
    );
    
    if (files.length === 0) {
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Loaded ${data.length} jobs from ${file}`);
        
        // Post-process data
        const processedData = data.map(job => {
          // Fix missing Company
          if (!job.Company && job['Job Title'] && job['Job Title'].includes(' - ')) {
            const parts = job['Job Title'].split(' - ');
            job.Company = parts[0].trim();
          }
          
          return job;
        });
        
        allJobs = allJobs.concat(processedData);
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    });
  });
  
  console.log(`Total jobs loaded: ${allJobs.length}`);
  return allJobs;
}

// Get unique companies with job counts
function getCompaniesData() {
  const jobs = loadJobsData();
  const companiesMap = new Map();
  
  jobs.forEach(job => {
    const companyName = job.Company || 'Unknown';
    if (!companiesMap.has(companyName)) {
      companiesMap.set(companyName, {
        name: companyName,
        jobCount: 0,
        locations: new Set(),
        jobs: []
      });
    }
    const company = companiesMap.get(companyName);
    company.jobCount++;
    if (job.City) {
      company.locations.add(job.City.split(',')[0].trim());
    }
    company.jobs.push(job);
  });
  
  return Array.from(companiesMap.values()).map(company => ({
    name: company.name,
    jobCount: company.jobCount,
    locations: Array.from(company.locations).slice(0, 3),
    logo: getCompanyLogo(company.name)
  }));
}

// Helper function to get company logo from local files
function getCompanyLogo(companyName) {
  const fileName = companyName
    .toLowerCase()
    .replace(/\s+(pvt|pvt\.|ltd|ltd\.|limited|inc|inc\.|corp|corporation|llc|llp|technologies|technology|services|solutions)\s*/gi, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .trim();
  
  return `/logos/${fileName}.png`;
}

// GET /api/companies - List all companies
router.get('/', (req, res) => {
  try {
    const companies = getCompaniesData();
    
    // Explicitly filter out IIMJobs and generic/bad company names
    const blacklistedNames = ['IIMJobs', 'Manager', 'Head', 'Senior Manager', 'Vice President', 'Director', 'Associate', 'Consultant'];
    
    const validCompanies = companies.filter(c => {
        const name = c.name;
        if (!name) return false;
        // Check blacklist
        if (blacklistedNames.includes(name)) return false;
        // Check partial match for IIMJobs
        if (name.toLowerCase().includes('iimjob')) return false;
        // Filter out names that look like job titles (e.g. contains "Manager -")
        if (name.includes(' - ')) return false;
        
        return true;
    });
    
    validCompanies.sort((a, b) => b.jobCount - a.jobCount);
    res.json(validCompanies);
  } catch (error) {
    console.error('Error loading companies:', error);
    res.status(500).json({ error: 'Failed to load companies' });
  }
});

// GET /api/companies/:name - Get company details with jobs
router.get('/:name', (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.name);
    const jobs = loadJobsData();
   const companyJobs = jobs.filter(job => 
      job.Company && job.Company.toLowerCase() === companyName.toLowerCase()
    );
    
    if (companyJobs.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const formattedJobs = companyJobs.map((job, idx) => {
      // Calculate applyUrl with fallbacks
      const applyUrl = job['Apply URL'] || job.URL || job['Naukri URL'] || job['Company Apply URL'];
      
      // Intelligently detect source if not specified
      let source = job.Source;
      if (!source && applyUrl) {
        if (applyUrl.includes('iimjobs.com')) {
          source = 'IIMJobs';
        } else if (applyUrl.includes('naukri.com')) {
          source = 'Naukri';
        } else {
          source = 'Unknown';
        }
      } else if (!source) {
        source = 'Unknown';
      }
      
      // Debug log for first job of each company
      if (idx === 0) {
        console.log(`\n=== FIRST JOB FOR COMPANY: ${companyName} ===`);
        console.log('Available columns:', Object.keys(job));
        console.log('Apply URL:', job['Apply URL']);
        console.log('URL:', job.URL);
        console.log('Final applyUrl:', applyUrl);
        console.log('Detected Source:', source);
      }
      
      return {
        id: Buffer.from(job.URL || job['Apply URL'] || job['Job Title']).toString('base64').substring(0, 20),
        title: job['Job Title'],
        description: job.Description || null,
        experience: job['Experience Reqd'],
        location: job.City,
        salary: job['Salary Range'] || 'Not Mentioned',
        datePosted: job['Date Posted'],
        // Support multiple column formats:
        // - 'Apply URL' from new fast scraper
        // - 'URL' from old scrapers (IIMJobs)
        // - 'Naukri URL' from other scrapers
        applyUrl: applyUrl,
        source: source
      };
    });
    
    res.json({
      name: companyName,
      logo: getCompanyLogo(companyName),
      jobCount: formattedJobs.length,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error('Error loading company:', error);
    res.status(500).json({ error: 'Failed to load company details' });
  }
});

module.exports = router;
