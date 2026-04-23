const OpenAI = require('openai');

let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    console.warn('⚠️ OPENAI_API_KEY not set. AI Analyzer will not work.');
  }
} catch (err) {
  console.error('OpenAI init failed:', err.message);
}

module.exports = openai;
