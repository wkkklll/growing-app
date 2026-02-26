export type LLMProviderName = "openai" | "claude" | "deepseek" | "aliyun"

export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMProvider {
  complete(prompt: string, options?: { maxTokens?: number }): Promise<string>
  chat(messages: Message[], options?: { maxTokens?: number }): Promise<string>
}
