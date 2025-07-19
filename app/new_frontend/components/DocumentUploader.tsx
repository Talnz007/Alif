"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { UserActivity } from '@/lib/user-activity';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

export default function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Get token

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.summary || data.content);
        if (token) {
          await UserActivity.uploadDocument(file.name, data.pageCount || 1, token);
        }
      } else {
        setError("Failed to process document");
      }
    } catch (err) {
      console.error(err);
      setError("Error processing document");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Upload Document</h3>

      <div className="flex items-center gap-2">
        <input
          type="file"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) setFile(selectedFile);
          }}
          accept=".pdf,.doc,.docx,.txt"
          className="flex-1"
          disabled={uploading}
        />

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Process
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {results && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-medium">Document Results</h4>
          </div>
          <p className="text-sm whitespace-pre-line">{results}</p>
        </div>
      )}
    </div>
  );
}