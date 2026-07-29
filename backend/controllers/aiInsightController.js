// Calls Gemini and parses the JSON insight it returns.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function generateInsight({ overall, totalSal, totalRev, central, rows, target = 46 }) {
  const prompt = `You are a CFO dashboard assistant.

Analyze this Salary vs Retainer data.

Target Salary %: ${target}%
Overall Salary %: ${((overall || 0) * 100).toFixed(2)}%
Total Monthly Salary: INR ${totalSal}
Total Monthly Retainer: INR ${totalRev}
Central Cost: INR ${central}

Brand Data:
${JSON.stringify(rows, null, 2)}

Return ONLY valid JSON, no markdown fences:
{
  "headline": "",
  "summary": "",
  "risk": "",
  "recommendations": ["...", "...", "..."],
  "biggest_drags": ["...", "..."]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini request failed (${res.status})`);

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(text);
}

module.exports = { generateInsight };