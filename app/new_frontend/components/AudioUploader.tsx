"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Headphones, X, RefreshCw, FileAudio } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivity } from '@/lib/user-activity';


interface AudioSummaryResponse {
  title?: string;
  summary?: string;
  bullet_points?: string[];
  transcript?: string;
}

export default function AudioUploader({ onClose }: { onClose?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  // Select file for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/flac'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.aiff'];

    // Check either mime type or extension
    const isValidType = validTypes.some(type => selectedFile.type.includes(type)) ||
      validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setError("Please select a valid audio file (MP3, WAV, M4A, OGG, AAC, FLAC, AIFF)");
      return;
    }

    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  // Process the audio
  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append("file", file);

      // Send to backend
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${apiBaseUrl}/transcribe?mode=both`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Processing failed");
      }

      setResult(responseData.data);

      await UserActivity.uploadAudio(
        file.name,
        // Estimate duration if not available in the response
        responseData.data?.duration || Math.round(file.size / 16000) // rough estimate
      );

      toast({
        title: "Success!",
        description: "Audio processed and summarized successfully.",
      });

    } catch (err: any) {
      console.error("Error processing audio:", err);
      setError(err.message || "Failed to process your audio file");
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro section */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl p-6 flex items-start space-x-4">
        <div className="bg-cyan-100 dark:bg-cyan-800 rounded-full p-3">
          <Headphones className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-cyan-700 dark:text-cyan-300">
            Audio Lecture Summarizer
          </h3>
          <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">
            Upload audio lectures to get AI-generated transcripts and concise summaries
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 min-h-[450px]">
            <h3 className="font-medium text-xl text-gray-900 dark:text-gray-100 mb-6">Upload Audio</h3>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
              id="audio-file-input"
            />

            {!file ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-10 flex flex-col items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center justify-center">
                  <FileAudio className="h-16 w-16 text-gray-400 mb-6"/>
                  <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
                    Upload an audio lecture file (MP3, WAV, M4A, OGG, etc.)
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full text-base py-6 px-8 flex items-center justify-center"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2"/>
                    Select Audio File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-6 bg-cyan-50 dark:bg-cyan-900/20 flex flex-col items-center">
                <div className="flex items-center w-full mb-6">
                  <FileAudio className="h-10 w-10 text-cyan-600 dark:text-cyan-400 mr-4"/>
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full p-2"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4"/>
                  </button>
                </div>

                {/* Audio player preview */}
                <div className="w-full mb-6">
                  <audio controls className="w-full" src={URL.createObjectURL(file)}></audio>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-6 text-base text-red-500">{error}</p>
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing || (!file && !result)}
                size="lg"
                className="px-6"
              >
                <RefreshCw className="h-5 w-5 mr-2"/>
                Reset
              </Button>
              <Button
                onClick={handleProcess}
                disabled={!file || isProcessing}
                className="bg-cyan-600 hover:bg-cyan-700 px-8"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                    Processing...
                  </>
                ) : (
                  "Generate Summary"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 min-h-[450px]">
            <h3 className="font-medium text-xl text-gray-900 dark:text-gray-100 mb-6">Summary Results</h3>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-16 w-16 text-cyan-500 animate-spin mb-6"/>
                <p className="text-lg text-cyan-600 dark:text-cyan-400">
                  Processing your audio file...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                  This might take a minute or two depending on the file size
                </p>
              </div>
            ) : result ? (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.5}}
                className="space-y-6"
              >
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-6">
                    {/* Title */}
                    {result.title && (
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-5 rounded-lg">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{result.title}</h2>
                      </div>
                    )}

                    {/* Summary paragraph */}
                    {result.summary && (
                      <div className="bg-white dark:bg-gray-900/70 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Summary
                        </h4>
                        <p className="text-gray-800 dark:text-gray-200">
                          {result.summary}
                        </p>
                      </div>
                    )}

                    {/* Bullet points */}
                    {result.bullet_points && result.bullet_points.length > 0 && (
                      <div className="bg-white dark:bg-gray-900/70 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Key Points
                        </h4>
                        <ul className="list-disc pl-5 space-y-2">
                          {result.bullet_points.map((point, index) => (
                            <li key={index} className="text-gray-800 dark:text-gray-200">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Show placeholder if no summary data */}
                    {!result.title && !result.summary && (!result.bullet_points || result.bullet_points.length === 0) && (
                      <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                        No summary information available. Check the transcript tab.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="transcript">
                    {result.transcript ? (
                      <div className="bg-white dark:bg-gray-900/70 p-5 rounded-lg border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto">
                        <h4 className="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Full Transcript
                        </h4>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {result.transcript}
                        </p>
                      </div>
                    ) : (
                      <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                        No transcript available.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[400px] text-gray-400 dark:text-gray-500">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-6">
                  <Headphones className="h-16 w-16"/>
                </div>
                <p className="text-xl font-medium mb-3">No Summary Yet</p>
                <p className="text-base">
                  Upload an audio lecture file to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tips for Best Results
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-1">
          <li>• Use clear audio recordings with minimal background noise</li>
          <li>• Keep files under 20MB for faster processing</li>
          <li>• Supported formats: MP3, WAV, M4A, OGG, AAC, FLAC, AIFF</li>
          <li>• Works best with lectures, presentations, and educational content</li>
          <li>• Processing time increases with audio length (be patient with longer files)</li>
        </ul>
      </div>
    </div>
  );
}