export function createChatCompletion() {
  return Promise.resolve({ choices: [{ message: { role: "assistant", content: "(fake answer)" } }] })
}
