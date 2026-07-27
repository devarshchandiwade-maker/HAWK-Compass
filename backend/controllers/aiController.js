const fs = require("fs");
const axios = require("axios");

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
  "tasks": [
    {
      "title": "",
      "assignee": "",
      "priority": "Low",
      "status": "To Do",
      "due_date": "",
      "notes": ""
    }
  ]
}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const raw =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid JSON from Gemini:");
      console.error(raw);

      return res.status(500).json({
        success: false,
        message: "Gemini returned invalid JSON",
        raw,
      });
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      result: parsed,
    });
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error(
      JSON.stringify(err.response?.data || err.message, null, 2)
    );

    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};

module.exports = {
  extractTasks,
};