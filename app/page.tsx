"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Send, Upload, FileText, X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function LinkedInAnalyzer() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [networkId, setNetworkId] = useState<string | null>(null)
  const [contactCount, setContactCount] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    setCsvFile(file)
    setSampleData(null)
    setUploadMessage(null)
    setErrorDetails(null)
    await handleUpload(file)
  }

  // Upload file to server
  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // If we have sample data, show it to help debug
        if (data.sampleData) {
          setSampleData(data.sampleData)
        }

        // If we have detailed error info, show it
        if (data.details) {
          setErrorDetails(data.details)
        }

        throw new Error(data.error || "Upload failed")
      }

      const { id, count, message } = data
      setNetworkId(id)
      setContactCount(count)

      if (message) {
        setUploadMessage(message)
      }

      toast({
        title: "Upload successful",
        description: `Processed ${count} contacts from your network`,
      })

      // Add system message
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I've analyzed your network with ${count} connections. What would you like to know about your professional network?`,
        },
      ])
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error processing your file",
        variant: "destructive",
      })
      // Clear the file input so the user can try again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setCsvFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  // Clear file
  const clearFile = () => {
    setCsvFile(null)
    setNetworkId(null)
    setContactCount(null)
    setMessages([])
    setSampleData(null)
    setUploadMessage(null)
    setErrorDetails(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Send message to chat API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !networkId) return

    // Add user message
    const userMessageId = crypto.randomUUID()
    const userMessage = {
      id: userMessageId,
      role: "user" as const,
      content: inputValue,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setErrorDetails(null) // Clear any previous errors

    // Prepare thread for API
    const thread = messages.map(({ role, content }) => ({ role, content }))

    try {
      // Create placeholder for assistant response
      const assistantMessageId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ])

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputValue,
          networkId,
          thread,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Chat request failed")
      }

      // Process streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let assistantResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert chunk to text and append
        const chunk = new TextDecoder().decode(value)
        assistantResponse += chunk

        // Update assistant message
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg)),
        )

        // Scroll to bottom as new content arrives
        scrollToBottom()
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Show error in UI
      setErrorDetails(error instanceof Error ? error.message : "Failed to get a response")

      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      })

      // Remove empty assistant message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.content !== ""))
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">LinkedIn Connections Analyzer</CardTitle>
          <CardDescription>Upload your LinkedIn connections CSV to analyze your professional network</CardDescription>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload LinkedIn CSV
                </>
              )}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

            {csvFile && networkId && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm truncate max-w-[200px]">{contactCount} contacts loaded</span>
                <button onClick={clearFile} className="text-gray-500 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {csvFile && !networkId && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm truncate max-w-[200px]">{csvFile.name}</span>
                <button onClick={clearFile} className="text-gray-500 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {uploadMessage && (
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>{uploadMessage}</AlertDescription>
            </Alert>
          )}

          {errorDetails && (
            <Alert className="mt-2" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="text-xs font-mono">{errorDetails}</AlertDescription>
            </Alert>
          )}

          {sampleData && (
            <div className="mt-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>CSV Format Issue</AlertTitle>
                <AlertDescription>
                  We couldn't process your CSV file properly. Here's what we found in your file:
                </AlertDescription>
              </Alert>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">{sampleData}</div>
              <p className="text-xs mt-2">
                Make sure you're uploading the Connections.csv file from your LinkedIn data export.
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <FileText className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p>Upload your LinkedIn connections CSV file to get started</p>
                <p className="text-sm mt-2">You can export your connections from LinkedIn by going to:</p>
                <p className="text-xs">
                  LinkedIn &gt; Me &gt; Settings &amp; Privacy &gt; Data Privacy &gt; Get a copy of your data
                </p>
                <div className="mt-4 text-sm">
                  <p className="font-semibold">Make sure you:</p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    <li>Select "Connections" when requesting your data</li>
                    <li>Upload the "Connections.csv" file from the downloaded archive</li>
                    <li>Wait for LinkedIn to email you when your data is ready</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    m.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {m.content || (m.role === "assistant" && isLoading ? "Thinking..." : "")}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                networkId ? "Ask about your LinkedIn network..." : "Upload a CSV file to start analyzing your network"
              }
              className="flex-grow"
              disabled={isLoading || !networkId}
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim() || !networkId}>
              {isLoading ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
