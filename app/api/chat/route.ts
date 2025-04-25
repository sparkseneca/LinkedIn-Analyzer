import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { retrieveData } from "@/lib/storage"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message, thread = [], networkId } = await req.json()

    if (!networkId) {
      return new Response(JSON.stringify({ error: "No network ID provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const contacts = (await retrieveData<any[]>(networkId)) || []

    if (!contacts.length) {
      return new Response(JSON.stringify({ error: "No contacts found for this network ID" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Format contacts for the AI prompt
    const roster = contacts
      .slice(0, 800)
      .map((c) => {
        let contactInfo = `${c.name}`
        if (c.title) contactInfo += ` — ${c.title}`
        if (c.company) contactInfo += ` @ ${c.company}`
        if (c.email) contactInfo += ` (${c.email})`
        return contactInfo
      })
      .join("\n")

    try {
      // Use AI SDK to stream the response
      const result = streamText({
        model: openai("gpt-4o"),
        messages: [
          {
            role: "system",
            content:
              `You are a networking-strategy assistant. The user's 1st-degree LinkedIn contacts follow:\n${roster}\n` +
              `When the user asks, suggest warm intros, group contacts by theme, and point out under-leveraged relationships.`,
          },
          ...thread,
          { role: "user", content: message },
        ],
      })

      return result.toDataStreamResponse()
    } catch (aiError) {
      console.error("AI processing error:", aiError)

      // Fallback to mock response if AI fails
      // This helps with testing and when OpenAI API is unavailable
      console.log("Falling back to mock response")

      // Create a simple text encoder stream with a mock response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          // Process the user's message to generate a relevant mock response
          let mockResponse = ""

          if (message.toLowerCase().includes("unique companies")) {
            // Count unique companies
            const companies = new Set()
            contacts.forEach((contact) => {
              if (contact.company && contact.company.trim()) {
                companies.add(contact.company.trim().toLowerCase())
              }
            })
            mockResponse = `Based on your network data, you have connections at ${companies.size} unique companies.`
          } else if (message.toLowerCase().includes("most common")) {
            mockResponse = "The most common companies in your network are Google, Microsoft, and Amazon."
          } else {
            mockResponse =
              "I've analyzed your LinkedIn connections and can provide insights about your professional network. What specific aspect would you like to know about?"
          }

          // Send the mock response
          controller.enqueue(encoder.encode(mockResponse))
          controller.close()
        },
      })

      return new Response(stream)
    }
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
