const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Deterministic sub-skill mappings — these are GUARANTEED to be applied
 * after AI matching, as a safety net. The AI handles most cases, but
 * gpt-4o-mini sometimes misses sub-skill implications. This fixes that.
 * 
 * Works across ALL professions.
 * Format: { parentSkill: [sub-skills it implies] }
 */
const SUB_SKILL_MAP = {
  // --- Tech ---
  'react': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'react.js': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'reactjs': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'angular': ['html', 'css', 'javascript', 'typescript', 'frontend', 'frontend development'],
  'angularjs': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'vue': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'vue.js': ['html', 'css', 'javascript', 'frontend', 'frontend development'],
  'next.js': ['react', 'html', 'css', 'javascript', 'frontend', 'frontend development'],
  'nextjs': ['react', 'html', 'css', 'javascript', 'frontend', 'frontend development'],
  'node.js': ['javascript', 'express', 'express.js', 'backend', 'backend development', 'rest api', 'rest apis', 'crud operations', 'crud'],
  'nodejs': ['javascript', 'express', 'express.js', 'backend', 'backend development', 'rest api', 'rest apis', 'crud operations', 'crud'],
  'express': ['node.js', 'javascript', 'backend', 'backend development', 'rest api', 'rest apis', 'crud operations', 'crud'],
  'express.js': ['node.js', 'javascript', 'backend', 'backend development', 'rest api', 'rest apis', 'crud operations', 'crud'],
  'django': ['python', 'backend', 'rest api', 'rest apis', 'crud operations'],
  'flask': ['python', 'backend', 'rest api', 'rest apis'],
  'spring boot': ['java', 'backend', 'rest api', 'rest apis', 'crud operations'],
  'mern stack': ['mongodb', 'express', 'react', 'node.js', 'html', 'css', 'javascript', 'rest apis', 'crud operations'],
  'mern': ['mongodb', 'express', 'react', 'node.js', 'html', 'css', 'javascript', 'rest apis', 'crud operations'],
  'mean stack': ['mongodb', 'express', 'angular', 'node.js', 'html', 'css', 'javascript', 'rest apis'],
  'rest api': ['crud operations', 'crud', 'http'],
  'rest apis': ['crud operations', 'crud', 'http'],
  'restful apis': ['crud operations', 'crud', 'http'],
  'mongodb': ['nosql', 'database'],
  'mysql': ['sql', 'database', 'rdbms'],
  'postgresql': ['sql', 'database', 'rdbms'],
  'aws': ['cloud', 'cloud computing', 'infrastructure'],
  'docker': ['containerization', 'devops'],
  'kubernetes': ['container orchestration', 'devops'],
  'git': ['version control'],
  'python': ['scripting', 'automation'],
  'problem-solving': ['analytical skills', 'critical thinking'],
  'problem solving': ['analytical skills', 'critical thinking'],
  'debugging': ['problem-solving', 'analytical skills'],

  // --- Marketing ---
  'digital marketing': ['seo', 'sem', 'social media marketing', 'content marketing', 'email marketing', 'analytics'],
  'growth marketing': ['seo', 'paid ads', 'a/b testing', 'funnel optimization', 'analytics'],
  'content marketing': ['copywriting', 'content strategy', 'blogging', 'seo'],
  'social media marketing': ['social media management', 'content creation', 'community management'],
  'seo': ['keyword research', 'on-page seo', 'analytics'],

  // --- Finance ---
  'financial modeling': ['excel', 'spreadsheets', 'budgeting', 'forecasting', 'valuation'],
  'financial analysis': ['excel', 'financial modeling', 'budgeting', 'forecasting', 'reporting'],
  'investment banking': ['financial modeling', 'valuation', 'm&a', 'due diligence', 'excel'],
  'accounting': ['bookkeeping', 'financial reporting', 'auditing', 'excel'],

  // --- Healthcare ---
  'clinical operations': ['patient care', 'medical records', 'hipaa compliance', 'clinical documentation'],
  'nursing': ['patient care', 'clinical skills', 'medication administration', 'vital signs'],

  // --- HR ---
  'full-cycle recruiting': ['candidate sourcing', 'screening', 'interviewing', 'offer negotiation', 'onboarding'],
  'talent acquisition': ['candidate sourcing', 'screening', 'interviewing', 'employer branding'],
  'human resources': ['employee relations', 'onboarding', 'compliance', 'payroll'],

  // --- Management ---
  'project management': ['project planning', 'stakeholder management', 'risk management', 'agile'],
  'supply chain management': ['logistics', 'inventory management', 'procurement', 'vendor management'],
  'business development': ['lead generation', 'client relations', 'sales strategy', 'negotiation'],
  'people management': ['team leadership', 'staff management', 'mentoring'],
  'team leadership': ['people management', 'staff management', 'mentoring'],

  // --- Data ---
  'data analysis': ['excel', 'sql', 'data visualization', 'statistical analysis', 'reporting'],
  'data science': ['python', 'machine learning', 'statistics', 'data analysis', 'sql'],
  'machine learning': ['python', 'statistics', 'data analysis'],

  // --- Tools → Skills ---
  'salesforce': ['crm', 'customer management'],
  'hubspot': ['marketing automation', 'crm', 'email marketing'],
  'quickbooks': ['accounting', 'bookkeeping'],
  'tableau': ['data visualization', 'data analysis'],
  'power bi': ['data visualization', 'data analysis'],
  'figma': ['ui/ux design', 'prototyping'],
  'sketch': ['ui/ux design', 'prototyping'],
  'jira': ['project management', 'agile'],
  'asana': ['project management', 'task management'],
  'sap': ['erp', 'enterprise resource planning'],
};

/**
 * Normalizes a skill name for comparison (lowercase, trim, strip punctuation)
 */
const normalizeForMatch = (skill) => {
  if (!skill) return '';
  return skill.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Deterministic post-processing: enforce sub-skill matches the AI may have missed.
 * For each skill the candidate has, expand it using the SUB_SKILL_MAP.
 * Then re-check required skills against the expanded set.
 * 
 * @param {Array<string>} resumeSkills - candidate's skills
 * @param {Array<string>} requiredSkills - JD required skills
 * @param {Object} aiResult - { matchedSkills, missingSkills, skillScore }
 * @returns {Object} - corrected { matchedSkills, missingSkills, skillScore }
 */
const enforceSubSkills = (resumeSkills, requiredSkills, aiResult) => {
  // Build expanded candidate skill set
  const candidateSkillsNorm = new Set((resumeSkills || []).map(normalizeForMatch));
  
  // Also add skills that were already matched by AI
  (aiResult.matchedSkills || []).forEach(s => candidateSkillsNorm.add(normalizeForMatch(s)));
  
  // Expand using sub-skill map
  const expandedSkills = new Set(candidateSkillsNorm);
  for (const skill of candidateSkillsNorm) {
    const subSkills = SUB_SKILL_MAP[skill];
    if (subSkills) {
      subSkills.forEach(sub => expandedSkills.add(sub));
    }
  }
  
  // Re-evaluate missing skills
  const matched = new Set((aiResult.matchedSkills || []).map(normalizeForMatch));
  const newMatched = [...(aiResult.matchedSkills || [])];
  const newMissing = [];
  
  for (const reqSkill of (aiResult.missingSkills || [])) {
    const reqNorm = normalizeForMatch(reqSkill);
    if (expandedSkills.has(reqNorm)) {
      // This "missing" skill is actually covered by a sub-skill expansion
      if (!matched.has(reqNorm)) {
        newMatched.push(reqSkill);
        matched.add(reqNorm);
      }
    } else {
      newMissing.push(reqSkill);
    }
  }
  
  // Recalculate score
  const totalRequired = requiredSkills.length;
  const newScore = totalRequired > 0 ? Math.round((newMatched.length / totalRequired) * 100) : 100;
  
  return {
    matchedSkills: newMatched,
    missingSkills: newMissing,
    skillScore: newScore
  };
};

/**
 * Uses OpenAI to intelligently match resume skills against job requirements.
 * The AI understands skill relationships, sub-skills, dependencies, and equivalences.
 * A deterministic post-processing layer then enforces sub-skill rules the AI may miss.
 * Works across ALL professions — tech, finance, healthcare, marketing, legal, etc.
 * 
 * @param {Array<string>} resumeSkills - Skills extracted from resume
 * @param {Array<string>} requiredSkills - Skills required by the job
 * @param {string} resumeFullText - Full resume text for context
 * @returns {Promise<Object>} - { matchedSkills, missingSkills, skillScore }
 */
exports.matchSkillsWithAI = async (resumeSkills = [], requiredSkills = [], resumeFullText = "") => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { 
      matchedSkills: [], 
      missingSkills: [], 
      skillScore: 100 
    };
  }

  try {
    const resumeSkillsStr = Array.isArray(resumeSkills) ? resumeSkills.join(', ') : 'None listed';
    const requiredSkillsStr = requiredSkills.join(', ');

    const prompt = `You are an expert recruiter with deep knowledge across ALL professions and industries. MATCH resume skills against job requirements using INTELLIGENT IMPLICIT MATCHING.

=== CORE MATCHING RULES ===

RULE 1 — SUB-SKILL RECOGNITION (CRITICAL):
If a candidate has a PARENT skill, they automatically have its sub-skills. Mark the sub-skills as MATCHED.

Tech examples:
- Has "React.js" → matched: HTML, CSS, JavaScript, Frontend Development
- Has "Node.js" → matched: JavaScript, Express.js, Backend Development, REST APIs, CRUD operations
- Has "Angular" → matched: HTML, CSS, JavaScript, TypeScript, Frontend Development
- Has "Vue.js" → matched: HTML, CSS, JavaScript, Frontend Development
- Has "Express.js" → matched: Node.js, JavaScript, Backend Development, REST APIs, CRUD operations
- Has "MERN Stack" → matched: MongoDB, Express, React, Node.js, HTML, CSS, JavaScript, REST APIs
- Has "REST APIs" → matched: CRUD operations, HTTP methods
- Has "Python" → matched: Scripting, Automation
- Has "AWS" → matched: Cloud Computing, Infrastructure

Non-tech examples:
- Has "Digital Marketing" → matched: SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing
- Has "Financial Modeling" → matched: Excel, Spreadsheets, Budgeting, Forecasting, Valuation
- Has "Project Management" → matched: Project Planning, Stakeholder Management, Risk Management, Agile
- Has "Full-cycle Recruiting" → matched: Candidate Sourcing, Screening, Interviewing, Onboarding
- Has "Clinical Operations" → matched: Patient Care, Medical Records, HIPAA Compliance
- Has "Supply Chain Management" → matched: Logistics, Inventory Management, Procurement, Vendor Management
- Has "Business Development" → matched: Lead Generation, Client Relations, Sales Strategy, Negotiation
- Has "Data Analysis" → matched: Excel, SQL, Data Visualization, Statistical Analysis, Reporting

RULE 2 — EQUIVALENT TERMINOLOGY:
Match skills that mean the same thing with different names.
- "B2B Sales" = "Enterprise Sales"
- "People Management" = "Team Leadership" = "Staff Management"
- "Bookkeeping" = "Accounts Management"
- "Problem-solving" = "Analytical skills" = "Critical thinking"
- "React" = "React.js" = "ReactJS"
- "Node" = "Node.js" = "NodeJS"

RULE 3 — TOOL IMPLIES SKILL:
If a candidate knows a tool, they have the underlying capability.
- "Salesforce" → CRM, Customer Management
- "QuickBooks" → Accounting, Bookkeeping
- "HubSpot" → Marketing Automation, CRM, Email Marketing
- "Tableau" / "Power BI" → Data Visualization, Data Analysis
- "Figma" / "Sketch" → UI/UX Design
- "JIRA" / "Asana" → Project Management
- "SAP" → ERP, Enterprise Resource Planning

RULE 4 — EXPERIENCE CONTEXT:
Scan the candidate's experience text. If they clearly performed a skill in their work but didn't list it, count it as matched.

=== CANDIDATE PROFILE ===
Stated Skills: ${resumeSkillsStr}
Experience Context: ${resumeFullText.substring(0, 1500)}

=== REQUIRED SKILLS ===
${requiredSkillsStr}

=== YOUR TASK ===
1. Determine the job's industry/domain from the required skills
2. For EACH candidate skill, apply Rules 1-3 to expand their skill set
3. Scan experience context (Rule 4) for demonstrated but unlisted skills
4. Check each required skill against the expanded skill set
5. matchedSkills = required skills the candidate HAS (directly or via rules)
6. missingSkills = required skills the candidate does NOT have
7. skillScore = (matchedSkills count / total required count) * 100

=== OUTPUT ===
Return ONLY valid JSON:
{
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "skillScore": 85
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert recruiter for ALL industries. ALWAYS apply sub-skill recognition: parent skills imply their sub-skills. React.js implies HTML/CSS/JavaScript. Node.js implies Express/REST APIs/CRUD operations. Digital Marketing implies SEO/SEM. Financial Modeling implies Excel/Budgeting. Match equivalent terminology across professions. Output ONLY valid JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05,
    });

    const aiResult = JSON.parse(response.choices[0].message.content);
    
    const result = {
      matchedSkills: Array.isArray(aiResult.matchedSkills) ? aiResult.matchedSkills : [],
      missingSkills: Array.isArray(aiResult.missingSkills) ? aiResult.missingSkills : [],
      skillScore: typeof aiResult.skillScore === 'number' ? aiResult.skillScore : 0
    };

    // Deterministic post-processing: enforce sub-skills the AI may have missed
    return enforceSubSkills(resumeSkills, requiredSkills, result);

  } catch (error) {
    console.error("AI skill matching failed:", error);
    throw new Error('Skill matching failed');
  }
};

/**
 * Batch version - matches multiple resumes against a job in one API call (more efficient).
 * Works across ALL professions — tech, finance, healthcare, marketing, legal, etc.
 * 
 * @param {Array<Object>} matchData - Array of { resumeId, resumeSkills, resumeFullText }
 * @param {Array<string>} requiredSkills - Job requirements
 * @returns {Promise<Array>} - Array of { resumeId, matchedSkills, missingSkills, skillScore }
 */
exports.matchSkillsWithAIBatch = async (matchData = [], requiredSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return matchData.map(m => ({
      resumeId: m.resumeId,
      matchedSkills: [],
      missingSkills: [],
      skillScore: 100
    }));
  }

  try {
    const requiredSkillsStr = requiredSkills.join(', ');
    
    // Format resume data for batch processing
    const resumeData = matchData.map((m, idx) => `
RESUME ${idx + 1} (ID: ${m.resumeId})
Stated Skills: ${Array.isArray(m.resumeSkills) ? m.resumeSkills.join(', ') : 'None listed'}
Full Experience Text:
${(m.resumeFullText || '').substring(0, 1000)}
---`).join('\n');

    const prompt = `You are an expert recruiter with deep knowledge across ALL professions and industries. MATCH resume skills to job requirements using INTELLIGENT IMPLICIT MATCHING.

=== CORE MATCHING RULES ===

RULE 1 — SUB-SKILL RECOGNITION (CRITICAL):
If a candidate has a PARENT skill, they automatically have its sub-skills. Mark the sub-skills as MATCHED.

Tech examples:
- Has "React.js" → matched: HTML, CSS, JavaScript, Frontend Development
- Has "Node.js" → matched: JavaScript, Express.js, Backend Development, REST APIs, CRUD operations
- Has "Angular" → matched: HTML, CSS, JavaScript, TypeScript, Frontend Development
- Has "Vue.js" → matched: HTML, CSS, JavaScript, Frontend Development
- Has "Express.js" → matched: Node.js, JavaScript, Backend Development, REST APIs, CRUD operations
- Has "MongoDB" → matched: NoSQL, Database, Backend
- Has "MERN Stack" → matched: MongoDB, Express, React, Node.js, HTML, CSS, JavaScript, REST APIs
- Has "REST APIs" → matched: CRUD operations, HTTP methods
- Has "Python" → matched: Scripting, Automation
- Has "AWS" → matched: Cloud Computing, Infrastructure

Non-tech examples:
- Has "Digital Marketing" → matched: SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing
- Has "Financial Modeling" → matched: Excel, Spreadsheets, Budgeting, Forecasting, Valuation
- Has "Project Management" → matched: Project Planning, Stakeholder Management, Risk Management, Agile
- Has "Full-cycle Recruiting" → matched: Candidate Sourcing, Screening, Interviewing, Onboarding
- Has "Clinical Operations" → matched: Patient Care, Medical Records, HIPAA Compliance
- Has "Supply Chain Management" → matched: Logistics, Inventory Management, Procurement, Vendor Management
- Has "Business Development" → matched: Lead Generation, Client Relations, Sales Strategy, Negotiation
- Has "Data Analysis" → matched: Excel, SQL, Data Visualization, Statistical Analysis, Reporting

RULE 2 — EQUIVALENT TERMINOLOGY:
Match skills that mean the same thing with different names.
- "B2B Sales" = "Enterprise Sales"
- "People Management" = "Team Leadership" = "Staff Management"
- "Problem-solving" = "Analytical skills" = "Critical thinking"
- "React" = "React.js" = "ReactJS"
- "Node" = "Node.js" = "NodeJS"
- "REST API" = "REST APIs" = "RESTful APIs"

RULE 3 — TOOL IMPLIES SKILL:
If a candidate knows a tool, they have the underlying capability.
- "Salesforce" → CRM, Customer Management
- "QuickBooks" → Accounting, Bookkeeping
- "HubSpot" → Marketing Automation, CRM, Email Marketing
- "Tableau" / "Power BI" → Data Visualization, Data Analysis
- "Figma" / "Sketch" → UI/UX Design
- "JIRA" / "Asana" → Project Management
- "SAP" → ERP, Enterprise Resource Planning

RULE 4 — EXPERIENCE CONTEXT:
Scan the candidate's experience text. If they clearly performed a skill in their work but didn't list it, count it as matched.

=== REQUIRED SKILLS TO MATCH ===
${requiredSkillsStr}

=== RESUMES TO EVALUATE ===
${resumeData}

=== YOUR TASK ===
For EACH resume:
1. Determine the job's industry/domain from the required skills
2. For EACH candidate skill, apply Rules 1-3 to expand their skill set
3. Scan experience text (Rule 4) for demonstrated but unlisted skills
4. Check each required skill against the expanded skill set
5. matchedSkills = required skills the candidate HAS (directly or via rules)
6. missingSkills = required skills the candidate does NOT have
7. skillScore = (matchedSkills count / total required count) * 100

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{
  "results": [
    {
      "resumeId": "id1",
      "matchedSkills": ["skill1", "skill2"],
      "missingSkills": ["skill3"],
      "skillScore": 85
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert recruiter for ALL industries. ALWAYS apply sub-skill recognition: parent skills imply their sub-skills. React.js implies HTML/CSS/JavaScript. Node.js implies Express/REST APIs/CRUD operations. Digital Marketing implies SEO/SEM. Financial Modeling implies Excel/Budgeting. Match equivalent terminology across professions. Output ONLY valid JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    
    // Validate and post-process results
    if (Array.isArray(parsed.results)) {
      // Build a lookup for resume skills
      const resumeSkillsMap = {};
      matchData.forEach(m => {
        resumeSkillsMap[m.resumeId] = m.resumeSkills || [];
      });

      return parsed.results.map(r => {
        const aiResult = {
          matchedSkills: Array.isArray(r.matchedSkills) ? r.matchedSkills : [],
          missingSkills: Array.isArray(r.missingSkills) ? r.missingSkills : [],
          skillScore: typeof r.skillScore === 'number' ? r.skillScore : 0
        };

        // Deterministic post-processing: enforce sub-skills the AI may have missed
        const corrected = enforceSubSkills(resumeSkillsMap[r.resumeId] || [], requiredSkills, aiResult);
        
        return {
          resumeId: r.resumeId,
          ...corrected
        };
      });
    }
    
    return [];

  } catch (error) {
    console.error("Batch AI skill matching failed:", error);
    throw new Error('Batch skill matching failed');
  }
};
