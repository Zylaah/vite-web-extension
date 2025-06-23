/**
 * Prompt templates for different use cases
 */

/**
 * Creates a system prompt for answering questions about a page
 * @param content - The page content
 * @returns The system prompt
 */
export function createQuestionPrompt(content: string): string {
  return `You are a helpful AI assistant. Answer the user's question based on the following webpage content. Be concise and accurate. If the answer is not in the content, say so.

WEBPAGE CONTENT:
${content}

Answer the user's question based only on the information provided above.`;
}

/**
 * Creates a system prompt for summarizing a page (optimized for speed and conciseness)
 * @param content - The page content
 * @returns The system prompt
 */
export function createSummaryPrompt(content: string): string {
  return `You are a helpful AI assistant. Summarize the following webpage content in a SHORT and CONCISE way. Focus ONLY on the 2-3 most important points.

REQUIREMENTS:
- Use bullet points (•) for each key point
- Maximum 3 bullet points
- Each bullet point should be 1-2 sentences maximum
- No introductory text, start directly with bullet points
- No line breaks within bullet points - keep each point on a single line
- Be factual and objective
- No markdown formatting

WEBPAGE CONTENT:
${content}

Provide ONLY the bullet points summary of the webpage content above.`;
}

/**
 * Creates a system prompt for analyzing important information in a text
 * @param text - The text to analyze
 * @returns The system prompt
 */
export function createImportanceAnalysisPrompt(text: string): string {
  return `You are an AI assistant that analyzes text to identify the most important parts. Review the following text and identify the 3-5 most important segments that contain key information, insights, or conclusions.

TEXT TO ANALYZE:
${text}

For each important segment, provide:
1. The exact text segment (word-for-word, no paraphrasing)
2. An importance score (1 for important, 2 for very important)

Format your response as a JSON array:
[
  {"text": "exact text segment 1", "importance": 2},
  {"text": "exact text segment 2", "importance": 1},
  ...
]

Only include the JSON array in your response, nothing else.`;
} 