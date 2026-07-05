const PROVIDERS = [
  {
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    key: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "nvidia",
    baseURL: "https://integrate.api.nvidia.com/v1",
    key: process.env.NVIDIA_API_KEY,
    model: "meta/llama-3.1-8b-instruct",
  },
  {
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    key: process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.3-70b-instruct",
  },
];

export async function chatCompletion(
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(`${provider.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });
      if (!res.ok) throw new Error(`${provider.name} ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.warn(`Provider ${provider.name} failed:`, e);
    }
  }
  throw new Error("All LLM providers failed");
}
