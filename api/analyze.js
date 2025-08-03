export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { promptA, promptB, userPrompt, image, temperature, maxTokens, topP, model } = req.body;

  async function callOpenAI(systemPrompt, userPrompt) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4.1-mini",
          temperature: parseFloat(temperature) || 0.7,
          max_output_tokens: parseInt(maxTokens) || 200,
          top_p: parseFloat(topP) || 1.0,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",  // 修正：text → input_text
                  text: `${systemPrompt || ""}\n\n${userPrompt || ""}`
                },
                {
                  type: "input_image", // 修正：image_url → input_image
                  image_url: image.startsWith("data:image")
                    ? image
                    : `data:image/jpeg;base64,${image}`
                }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error detail:", errorText);
        return `Error ${response.status}: ${errorText}`;
      }

      const data = await response.json();
      console.log("OpenAI API response:", JSON.stringify(data, null, 2));

      let comment = data.output_text;
      if (!comment && data.output && data.output[0]?.content[0]?.text) {
        comment = data.output[0].content[0].text;
      }

      return comment || "応答がありません";
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      return `エラー: ${error.message}`;
    }
  }

  try {
    const [commentA, commentB] = await Promise.all([
      callOpenAI(promptA, userPrompt),
      callOpenAI(promptB, userPrompt)
    ]);

    res.status(200).json({ commentA, commentB });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: error.message });
  }
}
