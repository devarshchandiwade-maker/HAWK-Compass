const axios = require("axios");

// Plain helper — takes the data object directly, returns the parsed insight
// (or throws). No req/res here; Insightcontroller.js's try/catch turns a
// thrown error into the actual HTTP response.
exports.generateInsight = async ({ overall, totalSal, totalRev, central, rows, target = 46 }) => {
  const prompt = `
You are a CFO dashboard assistant.

Analyze this Salary vs Retainer data.

Target Salary %: ${target}%

Overall Salary %: ${((overall || 0) * 100).toFixed(2)}%

Total Monthly Salary:
₹${totalSal}

Total Monthly Retainer:
₹${totalRev}

Central Cost:
₹${central}

Brand Data:
${JSON.stringify(rows, null, 2)}

Return ONLY valid JSON.

{
  "headline": "",
  "summary": "",
  "risk": "",
  "recommendations": [
    "...",
    "...",
    "..."
  ],
  "biggest_drags": [
    "...",
    "..."
  ]
}

Do not wrap the JSON in markdown.
`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  return JSON.parse(text); // return the object — no res.json here
};