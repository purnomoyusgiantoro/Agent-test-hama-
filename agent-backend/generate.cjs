const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\purnomo\\.gemini\\config\\skills\\humanizer\\SKILL.md', 'utf8');
const escaped = content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
const tsCode = `export const HUMANIZER_PROMPT = \`You must also translate your response to Indonesian if the user asks in Indonesian, but keep the humanized tone.\n\n${escaped}\n\`;`;
fs.writeFileSync('d:\\Documents\\Magang\\agent-backend\\src\\humanizerPrompt.ts', tsCode);
