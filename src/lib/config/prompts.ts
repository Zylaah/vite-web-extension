/**
 * Prompt templates for different use cases
 */

/**
 * Creates a system prompt for answering questions about a page
 * @param content - The page content
 * @param language - The response language ('english' or 'french')
 * @returns The system prompt
 */
export function createQuestionPrompt(content: string, language: 'english' | 'french' = 'english'): string {
  const languageInstructions = language === 'french' 
    ? `Vous êtes un assistant IA utile. Répondez à la question de l'utilisateur en vous basant sur le contenu de la page web suivante. Soyez concis et précis. Si la réponse ne se trouve pas dans le contenu, dites-le.

EXIGENCES DE FORMATAGE:
- Utilisez un formatage markdown approprié pour une meilleure lisibilité
- Formatez les URLs comme des liens markdown: [Texte du lien](https://example.com)
- Utilisez **gras** pour l'emphase et *italique* quand approprié
- Utilisez des puces ou des listes numérotées pour lister les éléments
- Utilisez des blocs de code (\`\`\`) pour les extraits de code
- Utilisez du code en ligne (\`code\`) pour les termes techniques
- Utilisez > des citations pour les citations importantes ou les points saillants
- Utilisez ## des titres pour structurer les réponses plus longues

CONTENU DE LA PAGE WEB:
${content}

Répondez à la question de l'utilisateur en vous basant uniquement sur les informations fournies ci-dessus en utilisant un formatage markdown approprié.`
    : `You are a helpful AI assistant. Answer the user's question based on the following webpage content. Be concise and accurate. If the answer is not in the content, say so.

FORMATTING REQUIREMENTS:
- Use proper markdown formatting for better readability
- Format URLs as markdown links: [Link Text](https://example.com)
- Use **bold** for emphasis and *italics* when appropriate
- Use bullet points or numbered lists when listing items
- Use code blocks (\`\`\`) for code snippets
- Use inline code (\`code\`) for technical terms
- Use > blockquotes for important quotes or highlights
- Use ## headings to structure longer responses

WEBPAGE CONTENT:
${content}

Answer the user's question based only on the information provided above using proper markdown formatting.`;

  return languageInstructions;
}

/**
 * Creates a system prompt for summarizing a page (optimized for speed and conciseness)
 * @param content - The page content
 * @param language - The response language ('english' or 'french')
 * @returns The system prompt
 */
export function createSummaryPrompt(content: string, language: 'english' | 'french' = 'english'): string {
  const languageInstructions = language === 'french'
    ? `Vous êtes un assistant IA utile. Résumez le contenu de la page web suivante de manière COURTE et CONCISE. Concentrez-vous UNIQUEMENT sur les 2-3 points les plus importants.

EXIGENCES:
- Utilisez des puces (-) pour chaque point clé
- Maximum 3 puces
- Chaque puce doit faire 1-2 phrases maximum
- Pas de texte d'introduction, commencez directement par les puces
- Soyez factuel et objectif
- Utilisez **gras** pour les termes ou concepts clés
- N'utilisez jamais le formatage markdown pour les puces
- Formatez les URLs comme des liens markdown: [Texte du lien](https://example.com)

CONTENU DE LA PAGE WEB:
${content}

Fournissez UNIQUEMENT le résumé en puces du contenu de la page web ci-dessus.`
    : `You are a helpful AI assistant. Summarize the following webpage content in a SHORT and CONCISE way. Focus ONLY on the 2-3 most important points.

REQUIREMENTS:
- Use bullet points (-) for each key point
- Maximum 3 bullet points
- Each bullet point should be 1-2 sentences maximum
- No introductory text, start directly with bullet points
- Be factual and objective
- Use **bold** for key terms or concepts
- Never use markdown formatting for the bullet points
- Format any URLs as markdown links: [Link Text](https://example.com)

WEBPAGE CONTENT:
${content}

Provide ONLY the bullet points summary of the webpage content above.`;

  return languageInstructions;
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