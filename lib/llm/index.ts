import type { LLMProvider, LLMProviderName } from "./types"
import { createAliyunProvider } from "./aliyun"
import { createClaudeProvider } from "./claude"
import { createDeepSeekProvider } from "./deepseek"
import { createOpenAIProvider } from "./openai"

let cachedProvider: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider

  const name = (process.env.LLM_PROVIDER ?? "aliyun") as LLMProviderName
  switch (name) {
    case "aliyun":
      cachedProvider = createAliyunProvider()
      break
    case "openai":
      cachedProvider = createOpenAIProvider()
      break
    case "claude":
      cachedProvider = createClaudeProvider()
      break
    case "deepseek":
      cachedProvider = createDeepSeekProvider()
      break
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${name}. Use aliyun | openai | claude | deepseek`)
  }
  return cachedProvider
}
