/**
 * Fuzzy string matching utility
 * Returns similarity score between 0 and 1
 */
export function similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Find best match from array of options using fuzzy matching
 * Returns matched item or null if no good match found
 */
export function findBestMatch<T>(
    search: string,
    options: T[],
    getName: (item: T) => string,
    threshold: number = 0.6
): T | null {
    let bestMatch: T | null = null;
    let bestScore = 0;
    
    for (const option of options) {
        const optionName = getName(option);
        const score = similarity(search, optionName);
        
        // Also check if search is contained in option (partial match)
        const containsMatch = optionName.toLowerCase().includes(search.toLowerCase()) || 
                              search.toLowerCase().includes(optionName.toLowerCase());
        
        const finalScore = containsMatch ? Math.max(score, 0.8) : score;
        
        if (finalScore > bestScore && finalScore >= threshold) {
            bestScore = finalScore;
            bestMatch = option;
        }
    }
    
    return bestMatch;
}

/**
 * Match multiple search terms to options using fuzzy matching
 * Returns array of matched items
 * Higher threshold for better accuracy
 */
export function matchMultiple<T>(
    searches: string[],
    options: T[],
    getName: (item: T) => string,
    threshold: number = 0.7 // Increased from 0.6 for stricter matching
): T[] {
    const matches: T[] = [];
    const used = new Set<T>();
    
    for (const search of searches) {
        if (!search || search.trim() === "") continue;
        
        const match = findBestMatch(
            search,
            options.filter(opt => !used.has(opt)),
            getName,
            threshold
        );
        
        if (match && !used.has(match)) {
            matches.push(match);
            used.add(match);
        }
    }
    
    return matches;
}
