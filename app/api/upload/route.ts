import { type NextRequest, NextResponse } from "next/server"
import { parseLinkedInCsv } from "@/lib/parse-linkedin-csv"
import { storeData } from "@/lib/storage"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()

    try {
      // Use the robust LinkedIn CSV parser
      const parsedContacts = parseLinkedInCsv(text)

      // Transform to the format expected by our application
      const contacts = parsedContacts.map((contact) => ({
        name: contact.fullName,
        title: contact.position,
        company: contact.company,
        email: contact.email,
        url: contact.url,
        connectedOn: contact.connectedOn,
      }))

      if (contacts.length === 0) {
        return NextResponse.json(
          {
            error: "No contacts found in CSV. The file appears to be empty.",
          },
          { status: 400 },
        )
      }

      // Store under a random key for the session
      const id = crypto.randomUUID()
      await storeData(id, contacts)

      return NextResponse.json({
        id,
        count: contacts.length,
      })
    } catch (parseError) {
      console.error("LinkedIn CSV parsing error:", parseError)

      // Provide a helpful error message
      let errorMessage = "Failed to parse LinkedIn CSV file"
      if (parseError instanceof Error) {
        errorMessage = parseError.message
      }

      // Show a sample of the file to help diagnose issues
      const sampleLines = text.substring(0, 500)

      return NextResponse.json(
        {
          error: errorMessage,
          sampleData: sampleLines,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json(
      {
        error: "Failed to process CSV file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
