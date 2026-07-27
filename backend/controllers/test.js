const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

(async () => {
  try {
    const models = await ai.models.list();

    for await (const model of models) {
      console.log(model.name);
      console.log(process.env.GEMINI_API_KEY);
    }
  } catch (e) {
    console.error(e);
    console.log(process.env.GEMINI_API_KEY);
  }
})();