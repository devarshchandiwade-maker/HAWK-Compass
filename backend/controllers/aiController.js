const fs = require("fs");
const axios = require("axios");

const extractTasks = async (req, res) => {

    let filePath = null;

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        filePath = req.file.path;

        const image = fs.readFileSync(filePath);

        const base64 = image.toString("base64");

        const response = await axios.post(

            "https://openrouter.ai/api/v1/chat/completions",

            {

                // Recommended model
                model: "google/gemini-2.5-flash",

                // VERY IMPORTANT
                max_tokens: 800,

                temperature: 0,

                messages: [

                    {
                        role: "system",
                        content: `You are an OCR and task extraction assistant.

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
}`
                    },

                    {

                        role: "user",

                        content: [

                            {
                                type: "text",
                                text: "Read the image carefully and extract every task. Return only JSON."
                            },

                            {

                                type: "image_url",

                                image_url: {

                                    url: `data:${req.file.mimetype};base64,${base64}`

                                }

                            }

                        ]

                    }

                ]

            },

            {

                headers: {

                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "Content-Type": "application/json",

                    // Recommended by OpenRouter
                    "HTTP-Referer": "http://localhost:5000",

                    "X-Title": "Ops Dashboard"

                }

            }

        );

        const raw = response.data.choices[0].message.content;

// Remove markdown code fences if the model wraps the JSON
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
        message: "AI returned invalid JSON",
        raw: cleaned
    });
}

if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
}

res.json({
    success: true,
    result: parsed
});

    }

    catch (err) {

        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.error(
            JSON.stringify(err.response?.data || err.message, null, 2)
        );

        res.status(500).json({

            success: false,

            error: err.response?.data || err.message

        });

    }

};

module.exports = {
    extractTasks
};