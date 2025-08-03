export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { image } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_output_tokens: 100,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze the following image and return concise descriptive tags (3-5) in English and the emotional tone of the image (Positive, Negative, or Neutral). 
Return the result strictly in JSON format as:
{
  "tags": ["tag1", "tag2", "tag3"],
  "emotions": ["Positive"]
}`
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    console.log("タグ抽出APIレスポンス:", data);

    // JSONとしてパース
    let parsed = {};
    try {
      parsed = JSON.parse(data.output_text || data.output[0]?.content[0]?.text || "{}");
    } catch (e) {
      parsed = { tags: [], emotions: [] };
    }

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
