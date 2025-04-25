import { parse } from "csv-parse/sync"

/**
 * Robust LinkedIn "Connections.csv" parser.
 * Handles:
 *   • Optional multi-line "Notes:" pre-amble
 *   • ️Header glued to the last Notes line (no newline)
 *   • Extra commas inside quoted cells
 */
export function parseLinkedInCsv(csvText: string) {
  // 1  Locate the very first occurrence of the header keyword
  const hdrPos = csvText.search(/(^|\r?\n)First Name,Last Name/i)
  if (hdrPos === -1) throw new Error("LinkedIn header row not found")

  // 2  Make sure the header is on its own line
  //    If LinkedIn forgot the newline, we inject one right before it.
  let body = csvText.slice(hdrPos)
  if (!body.startsWith("First Name")) {
    // hdrPos matched the leading newline; drop it
    body = body.replace(/^\r?\n/, "")
  } else {
    // No newline -> insert one so the CSV parser sees two separate records
    body = "\n" + body
  }

  // 3  Parse to objects
  const rows: Record<string, string>[] = parse(body, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  })

  // 4  Normalise
  return rows.map((r) => ({
    firstName: (r["First Name"] ?? "").trim(),
    lastName: (r["Last Name"] ?? "").trim(),
    fullName: [r["First Name"], r["Last Name"]].filter(Boolean).join(" "),
    url: (r["URL"] ?? "").trim(),
    email: (r["Email Address"] ?? "").trim(),
    company: (r["Company"] ?? r["Company Name"] ?? "").trim(),
    position: (r["Position"] ?? "").trim(),
    connectedOn: r["Connected On"] ? new Date(r["Connected On"]) : null,
  }))
}
