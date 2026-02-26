import type { LLMProvider, Message } from "./types"

export function createOpenAIProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set")

  const callApi = async (messages: Message[], options?: { maxTokens?: number }): Promise<string> => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${res.status} ${err}`)
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() ?? ""
  }

  return {
    async complete(prompt: string, options?: { maxTokens?: number }): Promise<string> {
      return callApi([{ role: "user", content: prompt }], options)
    },
    async chat(messages: Message[], options?: { maxTokens?: number }): Promise<string> {
      return callApi(messages, options)
    }
  }
}
