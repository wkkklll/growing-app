import type { LLMProvider, Message } from "./types"

export function createClaudeProvider(): LLMProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set")

  return {
    async complete(prompt: string, options?: { maxTokens?: number }): Promise<string> {
      const res = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: options?.maxTokens ?? 1024,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      )
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Anthropic API error: ${res.status} ${err}`)
      }
      const data = (await res.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text?.trim() ?? ""
    },

    async chat(messages: Message[], options?: { maxTokens?: number }): Promise<string> {
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: options?.maxTokens ?? 1024,
            messages: formattedMessages,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Anthropic API error: ${res.status} ${err}`)
      }
      const data = (await res.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text?.trim() ?? ""
    }
  }
}
