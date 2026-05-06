const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { optimizeText } = require('../utils/textOptimizer');

/**
 * Skill cluster decomposition mappings — when a JD mentions a cluster/stack,
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
 * Extracts and structures key requirements from a Job Description using OpenAI JSON mode.
 * Works across ALL professions — tech, finance, healthcare, marketing, legal, etc.
 * @param {string} title
 * @param {string} description
 * @param {string} requirements
 * @returns {Promise<Object>} - parsedData JSON object
 */
exports.parseJD = async (title, description, requirements) => {
  try {
    const optimizedTitle = optimizeText(title);
    const optimizedDescription = optimizeText(description);
    const optimizedRequirements = optimizeText(requirements);

    const prompt = `You are an expert recruiter who works across ALL industries and professions. Parse the following Job Description into structured JSON.
    
    CRITICAL INSTRUCTIONS:
    - Extract REQUIRED skills as those explicitly marked as "required" or in the main requirements section
    - Extract OPTIONAL skills as those marked "nice-to-have", "bonus", "preferred" or listed separately
    - For skills that are alternatives (e.g., "Kubernetes OR Docker"), extract them as separate required items since candidate may have one or the other
    - Extract ALL relevant skills — technical skills, soft skills, certifications, tools, methodologies, and domain-specific knowledge for ANY profession
    - When the JD mentions a skill cluster or umbrella term, ALSO extract its component sub-skills:
      * Tech: "MERN Stack" → also extract MongoDB, Express, React, Node.js
      * Tech: "React.js" → also extract HTML, CSS, JavaScript as sub-skills
      * Marketing: "Digital Marketing" → also extract SEO, SEM, Social Media Marketing, Content Marketing
      * Finance: "Financial Analysis" → also extract Financial Modeling, Budgeting, Forecasting
      * HR: "Full-cycle Recruiting" → also extract Sourcing, Screening, Interviewing
      * Healthcare: "Clinical Operations" → also extract Patient Care, Medical Records
    - Extract individual tools, frameworks, and methodologies mentioned in any context
    - Be precise and avoid duplicates
    
    The JSON structure MUST follow exactly this schema:
    {
      "required_skills": ["Array", "of", "required", "skills"],
      "optional_skills": ["Array", "of", "nice-to-have", "skills"],
      "experience_required": "Summary string of required experience level (e.g. '1 year', 'Senior'). If NO experience is specified in the text, output an empty string ''",
      "seniority_level": "One of: Entry-Level, Mid-Level, Senior, Lead, Executive, or Not Specified"
    }
    
    Job Title: ${optimizedTitle}
    Job Description: ${optimizedDescription}
    Requirements: ${optimizedRequirements || "N/A"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI assistant that only outputs valid JSON. Extract all domain-specific, technical, and soft skills accurately for ANY profession. When you see skill clusters, umbrella terms, or stacks, extract both the main name AND all component sub-skills." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    let parsedJson = JSON.parse(response.choices[0].message.content);
    
    // Post-processing: Expand skill cluster mentions to component skills
    const requiredSkills = Array.isArray(parsedJson.required_skills) ? parsedJson.required_skills : [];
    const optionalSkills = Array.isArray(parsedJson.optional_skills) ? parsedJson.optional_skills : [];
    
    const expandedRequired = new Set(requiredSkills);
    const expandedOptional = new Set(optionalSkills);
    
    // Check for skill cluster mentions in required skills and expand them
    const lowerRequired = requiredSkills.map(s => s.toLowerCase());
    for (const [clusterName, components] of Object.entries(skillClusterDecomposition)) {
      if (lowerRequired.some(s => s.includes(clusterName.toLowerCase()))) {
        components.forEach(comp => expandedRequired.add(comp));
      }
    }
    
    // Check for skill cluster mentions in optional skills and expand them
    const lowerOptional = optionalSkills.map(s => s.toLowerCase());
    for (const [clusterName, components] of Object.entries(skillClusterDecomposition)) {
      if (lowerOptional.some(s => s.includes(clusterName.toLowerCase()))) {
        components.forEach(comp => expandedOptional.add(comp));
      }
    }
    
    parsedJson.required_skills = Array.from(expandedRequired);
    parsedJson.optional_skills = Array.from(expandedOptional);
    return parsedJson;

  } catch (error) {
    console.error("OpenAI JD parsing failed:", error);
    throw new Error('JD parsing failed');
  }
};
