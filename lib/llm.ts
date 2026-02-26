import { getLLMProvider } from "./llm/index"
import { Message } from "./llm/types"

export async function getAliyunLLMResponse(messages: Message[]): Promise<string> {
  const provider = getLLMProvider()
  try {
    // Convert 'ai' role to 'assistant' for provider compatibility if needed
    const formattedMessages = messages.map(m => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: m.content
    })) as Message[]

    return await provider.chat(formattedMessages)
  } catch (error) {
    console.error("Error calling LLM provider:", error)
    throw error
  }
}

export async function callLLM(prompt: string): Promise<string> {
  const provider = getLLMProvider()
  try {
    return await provider.complete(prompt)
  } catch (error) {
    console.error("Error calling LLM provider:", error)
    throw error
  }
}

export { getLLMProvider } from "./llm/index"
