import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define common project query patterns
const PROJECT_INTENT_PATTERNS = [
  /(?:tell|what|know|hear)\s+(?:me|you|us)?\s+about\s+(?:jordan'?s?|your)?\s+(?:work|project|experience)\s+(?:on|with|at)\s+(.*?)(?:\?|$|\.)/i,
  /(?:can|could)\s+you\s+(?:tell|explain|describe|share)\s+(?:me|us)?\s+about\s+(.*?)(?:\?|$|\.)/i,
  /(?:jordan|you)\s+(?:worked|work|created|designed|developed|built)\s+(?:on|for|with)\s+(.*?)(?:\?|$|\.)/i,
  /(?:what|how)\s+(?:is|was|about)\s+(.*?)(?:\?|$|\.)/i,
];

// Define common project abbreviations and aliases
const PROJECT_ALIASES: Record<string, string[]> = {
  'Modern Day Sniper': ['MDS', 'Modern Day', 'Sniper'],
  'Aletheia Digital Media': ['Aletheia', 'ADM', 'Aletheia Media'],
  'Chiropractic Healthcare': ['Chiropractic', 'Healthcare'],
  'Portfolio Website': ['Portfolio', 'Personal Site', 'Personal Website'],
  'River City Travel Ball': ['RCTB', 'River City', 'Travel Ball'],
  // Add other project aliases as needed
};

/**
 * Cache of project titles to avoid repeated DB calls
 */
let projectCache: string[] | null = null;
let projectCacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Retrieves all project titles from the database
 */
export async function getAllProjects(): Promise<string[]> {
  // Return from cache if valid
  const now = Date.now();
  if (projectCache && now - projectCacheTimestamp < CACHE_TTL) {
    return projectCache;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('title')
      .order('title');

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    // Update cache
    projectCache = data.map(project => project.title);
    projectCacheTimestamp = now;
    
    return projectCache;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
}

/**
 * Determines if the query is asking about a specific project
 * and extracts the project name if possible
 */
export async function detectProjectQuery(query: string): Promise<{
  isProjectQuery: boolean;
  projectName: string | null;
  confidence: number;
  pattern?: string;
}> {
  // Get all projects for matching
  const allProjects = await getAllProjects();
  
  // Preprocessing - lowercase for case-insensitive matching
  const queryLower = query.toLowerCase();
  
  // 1. Direct match - check if any project name appears verbatim in the query
  for (const project of allProjects) {
    if (queryLower.includes(project.toLowerCase())) {
      return {
        isProjectQuery: true,
        projectName: project,
        confidence: 1.0,
        pattern: 'direct_match'
      };
    }
  }
  
  // 2. Check for alias matches
  for (const [projectName, aliases] of Object.entries(PROJECT_ALIASES)) {
    for (const alias of aliases) {
      if (queryLower.includes(alias.toLowerCase())) {
        return {
          isProjectQuery: true, 
          projectName,
          confidence: 0.9,
          pattern: 'alias_match'
        };
      }
    }
  }
  
  // 3. Check for intent patterns and extract potential project name
  for (const pattern of PROJECT_INTENT_PATTERNS) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const potentialProject = match[1].trim();
      
      // Try to match the extracted name with existing projects
      const bestMatch = findBestMatchingProject(potentialProject, allProjects);
      if (bestMatch && bestMatch.similarity > 0.6) {
        return {
          isProjectQuery: true,
          projectName: bestMatch.project,
          confidence: bestMatch.similarity,
          pattern: 'intent_pattern_match'
        };
      }
      
      // If no good match found, but has project intent
      return {
        isProjectQuery: true,
        projectName: null,
        confidence: 0.5,
        pattern: 'intent_without_match'
      };
    }
  }
  
  // 4. Check for general project intent without specific patterns
  const projectTerms = ['project', 'work', 'portfolio', 'case study', 'designed', 'developed', 'created'];
  const hasProjectTerm = projectTerms.some(term => queryLower.includes(term));
  
  if (hasProjectTerm) {
    return {
      isProjectQuery: true,
      projectName: null,
      confidence: 0.3,
      pattern: 'general_project_intent'
    };
  }
  
  // Not a project query
  return {
    isProjectQuery: false,
    projectName: null,
    confidence: 0
  };
}

/**
 * Finds the best matching project using fuzzy matching
 */
function findBestMatchingProject(query: string, projects: string[]) {
  const queryLower = query.toLowerCase();
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const project of projects) {
    const projectLower = project.toLowerCase();
    
    // Skip if too different in length (optimization)
    if (Math.abs(projectLower.length - queryLower.length) / Math.max(projectLower.length, queryLower.length) > 0.5) {
      continue;
    }
    
    // Calculate similarity score
    const similarity = calculateSimilarity(queryLower, projectLower);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = project;
    }
  }
  
  return bestMatch ? { project: bestMatch, similarity: highestSimilarity } : null;
}

/**
 * Calculates string similarity using a combination of techniques
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) return 1.0;
  
  // Contains check
  if (str1.includes(str2) || str2.includes(str1)) {
    const containedLength = Math.min(str1.length, str2.length);
    const containerLength = Math.max(str1.length, str2.length);
    return 0.7 + (0.3 * containedLength / containerLength);
  }
  
  // Word match ratio
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  const wordMatchRatio = commonWords.length / Math.max(words1.length, words2.length);
  
  // Character-level similarity (simplified Levenshtein distance ratio)
  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  const charMatchRatio = matches / Math.max(str1.length, str2.length);
  
  // Combined score with weights
  return 0.6 * wordMatchRatio + 0.4 * charMatchRatio;
} 