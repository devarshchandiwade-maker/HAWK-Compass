const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const extractTasks = async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    filePath = req.file.path;

    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString("base64");

    const prompt = `
You are an OCR and task extraction assistant.

Extract every task visible in the image.

Return ONLY valid JSON.

Example:

{
  "tasks":[
    {
      "title":"",
      "assignee":"",
      "priority":"Low",
      "status":"To Do",
      "due_date":"",
      "notes":""
    }
  ]
}
`;

    const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: [
    {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64,
          },
        },
      ],
    },
  ],
  config: {
    responseMimeType: "application/json",
    temperature: 0,
  },
});

const parsed = JSON.parse(response.text);

    const raw = response.text;

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:");
      console.error(cleaned);

      return res.status(500).json({
        success: false,
        message: "Gemini returned invalid JSON",
        raw: cleaned,
      });
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      result: parsed,
    });
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  extractTasks,
};