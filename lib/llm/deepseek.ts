import type { LLMProvider, Message } from "./types"

export function createDeepSeekProvider(): LLMProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set")

  return {
    async complete(prompt: string, options?: { maxTokens?: number }): Promise<string> {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: options?.maxTokens ?? 1024,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`DeepSeek API error: ${res.status} ${err}`)
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      return data.choices?.[0]?.message?.content?.trim() ?? ""
    },

    async chat(messages: Message[], options?: { maxTokens?: number }): Promise<string> {
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: formattedMessages,
          max_tokens: options?.maxTokens ?? 1024,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`DeepSeek API error: ${res.status} ${err}`)
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      return data.choices?.[0]?.message?.content?.trim() ?? ""
    }
  }
}
