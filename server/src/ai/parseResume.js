const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { optimizeText } = require('../utils/textOptimizer');

/**
 * Skill cluster decomposition mappings — when a resume mentions a cluster/stack,
 * expand to component skills. Covers tech stacks AND non-tech clusters.
 */
const skillClusterDecomposition = {
  // Tech stacks
  'mern': ['MongoDB', 'Express', 'React', 'Node.js'],
  'mern stack': ['MongoDB', 'Express', 'React', 'Node.js'],
  'mean': ['MongoDB', 'Express', 'Angular', 'Node.js'],
  'mean stack': ['MongoDB', 'Express', 'Angular', 'Node.js'],
  'lamp': ['Linux', 'Apache', 'MySQL', 'PHP'],
  'lamp stack': ['Linux', 'Apache', 'MySQL', 'PHP'],
  'jam': ['JavaScript', 'APIs', 'Markup'],
  'jam stack': ['JavaScript', 'APIs', 'Markup'],
  'lemp': ['Linux', 'Nginx', 'MySQL', 'PHP'],
  'lemp stack': ['Linux', 'Nginx', 'MySQL', 'PHP'],
  'full stack': ['Frontend', 'Backend', 'Database'],
  'web stack': ['Frontend', 'Backend', 'REST APIs'],
  // Marketing clusters
  'digital marketing': ['SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'Analytics'],
  'growth marketing': ['SEO', 'Paid Ads', 'A/B Testing', 'Funnel Optimization', 'Analytics'],
  // Finance clusters
  'financial analysis': ['Financial Modeling', 'Excel', 'Budgeting', 'Forecasting', 'Reporting'],
  'investment banking': ['Financial Modeling', 'Valuation', 'M&A', 'Due Diligence', 'Excel'],
  // Healthcare clusters
  'clinical operations': ['Patient Care', 'Medical Records', 'HIPAA Compliance', 'Clinical Documentation'],
  // HR clusters
  'full-cycle recruiting': ['Candidate Sourcing', 'Screening', 'Interviewing', 'Offer Negotiation', 'Onboarding'],
  'talent acquisition': ['Candidate Sourcing', 'Screening', 'Interviewing', 'Employer Branding'],
};

/**
 * Extracts raw text and structures it into skills, experience, and full text
 * using OpenAI chat completions API with JSON mode.
 * Works across ALL professions — tech, finance, healthcare, marketing, legal, etc.
 * 
 * @param {string} rawText - Extracted text from the Resume PDF
 * @returns {Promise<Object>} - Structured JSON representation
 */
exports.parseResume = async (rawText) => {
  try {
    const optimizedText = optimizeText(rawText);

    const prompt = `You are an expert recruiter who works across ALL industries and professions. Parse the following resume text and extract key information in JSON format.
    
    CRITICAL INSTRUCTIONS:
    - Extract ALL skills — technical skills, soft skills, certifications, tools, methodologies, and domain-specific knowledge for ANY profession
    - When the resume mentions a skill cluster or umbrella term, ALSO extract its component sub-skills:
      * Tech: "MERN Stack" → also extract MongoDB, Express, React, Node.js
      * Tech: "React.js" → also extract HTML, CSS, JavaScript
      * Tech: "Node.js" → also extract Express, JavaScript, REST APIs
      * Marketing: "Digital Marketing" → also extract SEO, SEM, Social Media Marketing
      * Finance: "Financial Analysis" → also extract Financial Modeling, Excel, Budgeting
      * HR: "Full-cycle Recruiting" → also extract Sourcing, Screening, Interviewing
      * Healthcare: "Clinical Operations" → also extract Patient Care, Medical Records
    - EXTRACT EVERY TOOL, METHODOLOGY, FRAMEWORK, AND SKILL MENTIONED IN THE PROJECTS SECTION. The complete skill set used in any project MUST be added to the skills array.
    - Include skills demonstrated in work experience, certifications, and education
    - Include industry-specific tools, platforms, and methodologies as separate skills
    - Do NOT include vague words like "resume", "CV", "working", or similar
    - Be thorough and extract even skills mentioned in passing
    
    The JSON structure MUST follow exactly this schema:
    {
      "skills": ["Array", "of", "all", "skills", "including", "sub-skills"],
      "experiencesummary": "A cohesive summary paragraph of all work experiences.",
      "total_years_experience": "An integer representing the total years of professional experience. Calculate it based on the work history dates if necessary. If not found, use 0.",
      "projects": ["Array of project descriptions"],
      "education": "Summary of educational background",
      "summary": "A brief overview or objective of the candidate"
    }
    
    Resume Text:
    ---
    ${optimizedText}
    ---
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI assistant that only outputs valid JSON. Extract all skills and experience accurately for ANY profession. When you see skill clusters, umbrella terms, or stacks, extract both the main name AND all component sub-skills." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    let parsedJson = JSON.parse(response.choices[0].message.content);
    
    // Validate and normalize response structure
    const skills = Array.isArray(parsedJson.skills) ? parsedJson.skills : [];
    const expandedSkills = new Set(skills);
    
    // Check for skill cluster mentions and expand them
    const lowerSkills = skills.map(s => s.toLowerCase());
    for (const [clusterName, components] of Object.entries(skillClusterDecomposition)) {
      if (lowerSkills.some(s => s.includes(clusterName.toLowerCase()))) {
        components.forEach(comp => expandedSkills.add(comp));
      }
    }
    
    // Parse total_years_experience to integer
    let yearsExperience = 0;
    if (typeof parsedJson.total_years_experience === 'number') {
      yearsExperience = Math.floor(parsedJson.total_years_experience);
    } else if (typeof parsedJson.total_years_experience === 'string') {
      // Extract first number from string like "5", "5 years", "5-7 years"
      const match = parsedJson.total_years_experience.match(/\d+/);
      yearsExperience = match ? parseInt(match[0], 10) : 0;
    }
    
    // Ensure all required fields exist with proper types
    parsedJson.skills = Array.from(expandedSkills);
    parsedJson.total_years_experience = yearsExperience;
    parsedJson.experiencesummary = typeof parsedJson.experiencesummary === 'string' ? parsedJson.experiencesummary : '';
    parsedJson.projects = Array.isArray(parsedJson.projects) ? parsedJson.projects : [];
    parsedJson.education = typeof parsedJson.education === 'string' ? parsedJson.education : '';
    parsedJson.summary = typeof parsedJson.summary === 'string' ? parsedJson.summary : '';
    
    return parsedJson;

  } catch (error) {
    console.error("OpenAI Resume parsing failed:", error);
    throw new Error('Resume parsing failed');
  }
};
