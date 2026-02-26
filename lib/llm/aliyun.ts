import type { LLMProvider, Message } from "./types"

export function createAliyunProvider(): LLMProvider {
  const apiKey = process.env.ALIYUN_API_KEY
  if (!apiKey) throw new Error("ALIYUN_API_KEY is not set")

  const baseUrl =
    process.env.ALIYUN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"
  const model = process.env.ALIYUN_MODEL_NAME ?? "qwen-turbo"

  const callApi = async (messages: Message[], options?: { maxTokens?: number }): Promise<string> => {
    const url = baseUrl.replace(/\/$/, "") + "/chat/completions"
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Aliyun API error: ${res.status} ${err}`)
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
