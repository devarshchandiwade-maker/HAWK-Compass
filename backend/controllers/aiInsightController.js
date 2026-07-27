// controllers/aiInsightController.js

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.salaryInsight = async (req, res) => {
  try {
    const {
      overall,
      totalSal,
      totalRev,
      central,
      rows,
      target,
    } = req.body;

    const prompt = `
You are a CFO dashboard assistant.

Analyze this Salary vs Retainer data.

Target Salary %: ${target}%

Overall Salary %: ${(overall * 100).toFixed(2)}%

Total Monthly Salary:
₹${totalSal}

Total Monthly Retainer:
₹${totalRev}

Central Cost:
₹${central}

Brand Data:
${JSON.stringify(rows, null, 2)}

Return ONLY JSON.

Format:

{
  "headline":"",
  "summary":"",
  "risk":"",
  "recommendations":[
      "...",
      "...",
      "..."
  ],
  "biggest_drags":[
      "...",
      "..."
  ]
}

Rules:

- Mention whether target is achieved.
- Mention how much extra revenue OR salary reduction is required.
- Mention highest salary % brands.
- Give practical recommendations.
- Keep summary under 80 words.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    res.json(JSON.parse(text));
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to generate AI insight",
    });
  }
};