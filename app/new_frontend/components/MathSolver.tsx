"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Camera, X, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import "katex/dist/katex.min.css";
// @ts-ignore
import { InlineMath, BlockMath } from "react-katex";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

// Types based on your backend response
interface MathSolverResponse {
  extracted_problem: string;
  solution: string;
  katex_solution: string;
}

// Function to parse and render LaTeX in text
const RenderMathContent = ({ content }: { content: string }) => {
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => {
        if (!line.trim()) return <br key={`br-${lineIndex}`} />;

        const segments = [];
        let lastIndex = 0;
        let inMath = false;
        let mathContent = '';

        for (let i = 0; i < line.length; i++) {
          if (line[i] === '$') {
            if (inMath) {
              segments.push({ type: 'math', content: mathContent });
              lastIndex = i + 1;
              inMath = false;
              mathContent = '';
            } else {
              if (i > lastIndex) {
                segments.push({ type: 'text', content: line.substring(lastIndex, i) });
              }
              inMath = true;
              lastIndex = i + 1;
            }
          } else if (inMath) {
            mathContent += line[i];
          }
        }

        if (lastIndex < line.length) {
          segments.push({ type: 'text', content: line.substring(lastIndex) });
        }

        if (segments.length === 0) {
          return <p key={lineIndex} className="mb-2">{line}</p>;
        }

        return (
          <p key={lineIndex} className="mb-2">
            {segments.map((segment, i) => {
              if (segment.type === 'math') {
                try {
                  return <InlineMath key={i} math={segment.content} />;
                } catch (e) {
                  return <span key={i} className="text-red-500">{`$${segment.content}$`}</span>;
                }
              } else {
                return <span key={i}>{segment.content}</span>;
              }
            })}
          </p>
        );
      })}
    </>
  );
};

export default function MathSolver({ onClose }: { onClose?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState<MathSolverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth(); // Get token

  const handleReset = () => {
    setFile(null);
    setImagePreview(null);
    setSolution(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*;capture=camera";
      fileInputRef.current.click();
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSolve = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userId = localStorage.getItem("user_id");
      if (userId) {
        formData.append("user_id", userId);
      }

      const response = await fetch("/api/solve-math-problem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: MathSolverResponse = await response.json();
      setSolution(data);

      if (userId && token) {
        await fetch("/api/activities/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            activityType: "math_problem_solved",
            metadata: {
              problemType: "math",
              fileName: file.name,
              fileSize: file.size
            }
          }),
        });
        await fetch("/api/users/" + userId + "/streak", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
      }
    } catch (err: any) {
      console.error("Error processing math problem:", err);
      setError(err.message || "Failed to process your math problem");
      toast({
        title: "Error",
        description: "Failed to solve the math problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-6 flex items-start space-x-4">
        <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-3">
          <Camera className="h-6 w-6 text-amber-600 dark:text-amber-300" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-amber-700 dark:text-amber-300">
            Math Problem Solver
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Take a photo or upload an image of your math problem to get a step-by-step solution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 min-h-[450px]">
            <h3 className="font-medium text-xl text-gray-900 dark:text-gray-100 mb-6">Upload Problem</h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="math-image-input"
            />

            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-10 flex flex-col items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-16 w-16 text-gray-400 mb-6"/>
                  <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
                    Drag and drop your image here, or click below to select a file
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full sm:w-auto text-base py-6 px-8 flex items-center justify-center"
                      size="lg"
                    >
                      <Upload className="h-5 w-5 mr-2"/>
                      Browse Files
                    </Button>
                    <Button
                      onClick={handleCameraCapture}
                      variant="default"
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-base py-6 px-8 flex items-center justify-center"
                      size="lg"
                    >
                      <Camera className="h-5 w-5 mr-2"/>
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Math problem"
                  className="w-full object-contain min-h-[300px] max-h-[450px] rounded-lg"
                />
                <button
                  onClick={handleClearFile}
                  className="absolute top-4 right-4 bg-black bg-opacity-70 text-white rounded-full p-2"
                  aria-label="Clear image"
                >
                  <X className="h-5 w-5"/>
                </button>
              </div>
            )}

            {error && (
              <p className="mt-6 text-base text-red-500">{error}</p>
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing || (!file && !solution)}
                size="lg"
                className="px-6"
              >
                <RefreshCw className="h-5 w-5 mr-2"/>
                Reset
              </Button>
              <Button
                onClick={handleSolve}
                disabled={!file || isProcessing}
                className="bg-amber-600 hover:bg-amber-700 px-8"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                    Solving...
                  </>
                ) : (
                  "Solve Problem"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 min-h-[450px]">
            <h3 className="font-medium text-xl text-gray-900 dark:text-gray-100 mb-6">Solution</h3>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin mb-6"/>
                <p className="text-lg text-amber-600 dark:text-amber-400">
                  Processing your math problem...
                </p>
              </div>
            ) : solution ? (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.5}}
                className="space-y-8"
              >
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
                  <h4 className="text-base font-medium text-amber-800 dark:text-amber-300 mb-3">
                    Extracted Problem
                  </h4>
                  <div className="math-display">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-800">
                      <div className="katex-large">
                        <BlockMath math={solution.extracted_problem}/>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Step-by-Step Solution
                  </h4>
                  <div className="p-5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-line math-display overflow-y-auto max-h-[400px] solution-text">
                    <div className="solution-steps">
                      <RenderMathContent content={solution.solution} />
                    </div>
                  </div>
                </div>

                {solution.katex_solution && (
                  <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800 mt-4">
                    <h4 className="text-base font-medium text-green-800 dark:text-green-300 mb-3">
                      Final Answer
                    </h4>
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="katex-xlarge">
                        <BlockMath math={solution.katex_solution}/>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[400px] text-gray-400 dark:text-gray-500">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-6">
                  <Camera className="h-16 w-16"/>
                </div>
                <p className="text-xl font-medium mb-3">No Solution Yet</p>
                <p className="text-base">
                  Upload a photo of your math problem to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tips for Best Results
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-1">
          <li>• Take clear photos with good lighting</li>
          <li>• Make sure the entire problem is visible</li>
          <li>• Crop out unnecessary parts of the image</li>
          <li>• Works best with algebra, calculus, and trigonometry problems</li>
        </ul>
      </div>

      <style jsx global>{`
        .katex-large .katex { font-size: 1.5em !important; }
        .katex-xlarge .katex { font-size: 1.75em !important; }
        .solution-steps { font-size: 1.1rem; line-height: 1.8; }
        .katex { font-size: 1.15em !important; }
        .katex-display { overflow-x: auto; max-width: 100%; padding: 0.5em 0; }
        .katex-display > .katex { display: block; text-align: center; }
        .math-display .katex-html { line-height: 1.5 !important; }
      `}</style>
    </div>
  );
}