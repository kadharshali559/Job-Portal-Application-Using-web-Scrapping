const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// COMPREHENSIVE SKILL KEYWORDS DATABASE
const SKILL_KEYWORDS = [
  // ==== PROGRAMMING LANGUAGES ====
  'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 
  'typescript', 'scala', 'r', 'perl', 'objective-c', 'dart', 'elixir', 'haskell', 'lua', 'assembly',
  'cobol', 'fortran', 'matlab', 'visual basic', 'vb.net', 'groovy', 'clojure', 'f#', 'erlang',
  
  //==== FRONTEND DEVELOPMENT ====
  'react', 'angular', 'vue', 'vue.js', 'svelte', 'ember', 'backbone', 'jquery', 'html', 'html5', 
  'css', 'css3', 'sass', 'scss', 'less', 'stylus', 'bootstrap', 'tailwind', 'tailwindcss', 
  'material-ui', 'ant design', 'chakra ui', 'semantic ui', 'bulma', 'foundation',
  'next.js', 'nextjs', 'gatsby', 'nuxt', 'webpack', 'vite', 'parcel', 'rollup', 'babel',
  'redux', 'mobx', 'recoil', 'zustand', 'context api', 'react hooks', 'react router',
  'responsive design', 'mobile-first', 'cross-browser', 'web accessibility', 'wcag', 'aria',
  
  // ==== BACKEND DEVELOPMENT ====
  'node', 'nodejs', 'node.js', 'express', 'expressjs', 'django', 'flask', 'fastapi', 'spring', 
  'spring boot', 'rails', 'ruby on rails', 'laravel', 'asp.net', '.net', '.net core', 'php', 
  'symfony', 'codeigniter', 'nest.js', 'nestjs', 'koa', 'hapi', 'meteor', 'sails',
  'microservices', 'rest api', 'restful', 'graphql', 'grpc', 'websocket', 'socket.io',
  'swagger', 'openapi', 'postman', 'api gateway', 'serverless', 'lambda',
  
  // ==== DATABASES ====
  'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'oracle', 'sql server', 'mssql',
  'sqlite', 'mariadb', 'cassandra', 'dynamodb', 'firebase', 'firestore', 'couchdb', 'neo4j',
  'elasticsearch', 'solr', 'memcached', 'influxdb', 'timescaledb', 'cockroachdb',
  'database design', 'database optimization', 'query optimization', 'indexing', 'sharding',
  'replication', 'nosql', 'acid', 'transactions', 'orm', 'sequelize', 'typeorm', 'prisma',
  'mongoose', 'hibernate', 'entity framework',
  
  // ==== CLOUD & DEVOPS ====
  'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud', 
  'cloud computing', 'iaas', 'paas', 'saas', 's3', 'ec2', 'lambda', 'cloudfront', 'rds',
  'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github', 'github actions', 'ci/cd',
  'terraform', 'ansible', 'puppet', 'chef', 'vagrant', 'helm', 'istio', 'prometheus',
  'grafana', 'elk stack', 'nginx', 'apache', 'linux', 'unix', 'bash', 'shell scripting',
  'devops', 'sre', 'infrastructure as code', 'containerization', 'orchestration',
  
  // ==== MOBILE DEVELOPMENT ====
  'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova', 'phonegap',
  'swift ui', 'jetpack compose', 'mobile development', 'app development', 'pwa',
  'progressive web apps', 'android studio', 'xcode',
  
  // ==== DATA SCIENCE & AI/ML ====
  'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'ml', 'dl', 
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib',
  'seaborn', 'plotly', 'nlp', 'natural language processing', 'computer vision', 'opencv',
  'data science', 'data analysis', 'data analytics', 'data visualization', 'big data',
  'power bi', 'tableau', 'looker', 'qlikview', 'excel', 'vba', 'spark', 'apache spark',
  'hadoop', 'mapreduce', 'hive', 'pig', 'kafka', 'airflow', 'etl', 'data pipeline',
  'statistics', 'probability', 'regression', 'classification', 'clustering', 'neural networks',
  'cnn', 'rnn', 'lstm', 'gpt', 'bert', 'transformers', 'reinforcement learning',
  'time series', 'forecasting', 'anomaly detection', 'recommendation systems',
  
  // ==== TESTING & QA ====
  'selenium', 'jest', 'mocha', 'chai', 'jasmine', 'karma', 'cypress', 'protractor', 'puppeteer',
  'playwright', 'junit', 'testng', 'pytest', 'unittest', 'testing', 'qa', 'quality assurance',
  'test automation', 'unit testing', 'integration testing', 'e2e testing', 'tdd', 'bdd',
  'test-driven development', 'cucumber', 'behave', 'robot framework', 'performance testing',
  'load testing', 'stress testing', 'jmeter', 'gatling', 'locust',
  
  // ==== VERSION CONTROL ====
  'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'version control',
  'source control', 'git flow', 'branching', 'merging', 'pull requests', 'code review',
  
  // ==== PROJECT MANAGEMENT & METHODOLOGIES ====
  'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma', 'prince2', 'pmp',
  'jira', 'confluence', 'trello', 'asana', 'monday.com', 'clickup', 'slack', 'ms project',
  'sprint planning', 'backlog grooming', 'retrospectives', 'daily standups',
  
  // ==== BUSINESS & ENTERPRISE ====
  'sap', 'oracle erp', 'salesforce', 'crm', 'erp', 'servicenow', 'workday', 'peoplesoft',
  'sap hana', 'sap fico', 'sap mm', 'sap sd', 'sap abap', 'sap basis',
  'mainframe', 'cobol', 'jcl', 'cics', 'db2', 'vsam',
  'informatica', 'talend', 'pentaho', 'ssis', 'data warehousing', 'data modeling',
  'business intelligence', 'bi', 'olap', 'data mining', 'dimensional modeling',
  'snowflake', 'databricks', 'redshift', 'bigquery',
  
  // ==== SOFT SKILLS ====
  'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking',
  'analytical', 'creativity', 'adaptability', 'time management', 'organization',
  'collaboration', 'interpersonal', 'presentation', 'public speaking', 'conflict resolution',
  'decision making', 'strategic thinking', 'attention to detail', 'multitasking',
  'self-motivated', 'proactive', 'initiative', 'work ethic', 'professionalism',
  'customer service', 'client management', 'stakeholder management', 'negotiation',
  'mentoring', 'coaching', 'training', 'documentation', 'technical writing',
  
  // ==== SECURITY ====
  'cybersecurity', 'information security', 'network security', 'application security',
  'penetration testing', 'ethical hacking', 'owasp', 'ssl', 'tls', 'encryption',
  'oauth', 'jwt', 'authentication', 'authorization', 'firewall', 'vpn', 'ids', 'ips',
  'siem', 'vulnerability assessment', 'security auditing', 'compliance', 'gdpr', 'hipaa',
  
  // ==== NETWORKING ====
  'tcp/ip', 'dns', 'dhcp', 'routing', 'switching', 'cisco', 'juniper', 'network administration',
  'vpn', 'wan', 'lan', 'vlan', 'bgp', 'ospf', 'mpls', 'sdn', 'network protocols',
  
  // ==== OTHER TOOLS & TECHNOLOGIES ====
  'visual studio code', 'vscode', 'intellij', 'pycharm', 'eclipse', 'sublime text',
  'vim', 'atom', 'notepad++', 'jupyter', 'anaconda', 'google colab',
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'canva',
  'ui/ux', 'user experience', 'user interface', 'wireframing', 'prototyping',
  'wordpress', 'drupal', 'joomla', 'magento', 'shopify', 'woocommerce',
  'blockchain', 'cryptocurrency', 'ethereum', 'smart contracts', 'web3', 'solidity',
  'iot', 'internet of things', 'embedded systems', 'arduino', 'raspberry pi',
  'game development', 'unity', 'unreal engine', 'godot', 'game design',
  '3d modeling', 'blender', 'maya', 'cad', 'solidworks',
  
  // ==== DOMAIN KNOWLEDGE ====
  'finance', 'banking', 'fintech', 'healthcare', 'e-commerce', 'retail', 'logistics',
  'supply chain', 'manufacturing', 'telecommunications', 'education', 'edtech',
  'media', 'entertainment', 'travel', 'hospitality', 'real estate', 'insurance',
  'automotive', 'energy', 'utilities', 'government', 'nonprofit',
  
  // ==== ADDITIONAL TECHNICAL SKILLS ====
  'json', 'xml', 'yaml', 'ajax', 'cors', 'caching', 'cdn', 'load balancing',
  'reverse proxy', 'message queues', 'rabbitmq', 'activemq', 'pub/sub',
  'event-driven', 'service mesh', 'api design', 'system design', 'architecture',
  'design patterns', 'solid principles', 'clean code', 'code quality', 'refactoring',
  'debugging', 'troubleshooting', 'monitoring', 'logging', 'error handling',
  'optimization', 'scalability', 'high availability', 'fault tolerance', 'disaster recovery',
  'backup', 'migration', 'deployment', 'release management', 'continuous integration',
  'continuous deployment', 'automation', 'scripting'
];

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.toLowerCase();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.toLowerCase();
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return '';
  }
}

function extractSkillsFromText(text) {
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  // Check each skill keyword
  for (const skill of SKILL_KEYWORDS) {
    const skillLower = skill.toLowerCase();
    
    // Use word boundary matching for more accurate detection
    const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    if (regex.test(textLower)) {
      // Capitalize properly for display
      const formattedSkill = skill.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      foundSkills.push(formattedSkill);
    }
  }
  
  // Also look for skills after common headings
  const skillSections = [
    /skills?\s*:?\s*([^\n]+)/gi,
    /technical skills?\s*:?\s*([^\n]+)/gi,
    /core competencies\s*:?\s*([^\n]+)/gi,
    /proficienc(?:y|ies)\s*:?\s*([^\n]+)/gi,
    /expertise\s*:?\s*([^\n]+)/gi,
    /technologies\s*:?\s*([^\n]+)/gi,
    /tools?\s*:?\s*([^\n]+)/gi,
    /languages?\s*:?\s*([^\n]+)/gi,
  ];
  
  for (const pattern of skillSections) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const sectionText = match[1];
      // Extract individual skills separated by common delimiters
      const extractedSkills = sectionText.split(/[,;|•·]/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && s.length < 30); // Filter reasonable skill lengths
      
      foundSkills.push(...extractedSkills);
    }
  }
  
  // Remove duplicates (case-insensitive)
  const uniqueSkills = [];
  const seenLower = new Set();
  
  for (const skill of foundSkills) {
    const lowerSkill = skill.toLowerCase();
    if (!seenLower.has(lowerSkill)) {
      seenLower.add(lowerSkill);
      uniqueSkills.push(skill);
    }
  }
  
  return uniqueSkills;
}

async function extractSkillsFromResume(filePath) {
  let text = '';
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    text = await extractTextFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    text = await extractTextFromDocx(filePath);
  } else {
    // Try reading as plain text
    try {
      text = fs.readFileSync(filePath, 'utf8').toLowerCase();
    } catch (error) {
      console.error('Error reading file:', error);
      return [];
    }
  }
  
  const skills = extractSkillsFromText(text);
  
  console.log(`Extracted ${skills.length} skills from resume:`, skills.slice(0, 20));
  
  return skills;
}

module.exports = { extractSkillsFromResume };
