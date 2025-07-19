"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileUp, Copy, FileText } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { UserActivity } from '@/lib/user-activity';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

interface SummaryGeneratorProps {
  onClose: () => void
}

export default function SummaryGenerator({ onClose }: SummaryGeneratorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileText, setFileText] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuth(); // Get token

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      if (selectedFile.type === "text/plain") {
        const text = await selectedFile.text();
        setFileText(text);
      } else if (selectedFile.type === "application/pdf") {
        setFileText("PDF content will be extracted by the backend.");
      } else {
        setFileText("File type not supported for direct text extraction.");
      }
    }
  }

  const generateSummary = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (file.type === "text/plain") {
        const response = await fetch("http://localhost:8000/api/v1/summarize/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ text: fileText }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setSummary(data.summary);
        if (token) {
          await UserActivity.summarizeText(fileText.length || file.size, token);
        }
      } else {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:8000/api/v1/upload-for-summary/", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setSummary(data.summary);
        if (token) {
          await UserActivity.summarizeText(fileText.length || file.size, token);
        }
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setError(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied",
      description: "Summary copied to clipboard",
    });
  };

  return (
    <div className="p-4">
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Upload Document</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.txt,.docx"
                className="hidden"
              />
              <Button
                onClick={handleFileButtonClick}
                variant="outline"
                className="w-full border-dashed border-2 h-16"
              >
                <FileUp className="h-5 w-5 mr-2" />
                Choose File
              </Button>
            </div>

            {file && (
              <div className="flex-1 flex items-center bg-muted rounded-lg p-3">
                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={generateSummary}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Summary...
            </>
          ) : (
            "Generate Summary"
          )}
        </Button>

        {summary && (
          <div className="rounded-lg border p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Generated Summary</h3>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <Textarea 
              value={summary} 
              readOnly 
              className="min-h-[300px]" 
            />
          </div>
        )}
      </div>
    </div>
  );
}