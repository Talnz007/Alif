"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Mic, BrainCircuit, ArrowRight, Check } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "PDF Extraction",
    description: "Upload any study material and get instant summaries",
  },
  {
    icon: Mic,
    title: "Speech-to-Text",
    description: "Convert lectures into searchable notes in real-time",
  },
  {
    icon: BrainCircuit,
    title: "AI Tutoring",
    description: "Get personalized help with any subject",
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      router.push("/app")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold">Welcome to Alif! 👋</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Let's get you started with the basics. Here's what you can do with Alif:
                </p>
                <div className="grid gap-4">
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-start space-x-4"
                    >
                      <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold">Track Your Progress 📈</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Stay motivated with our gamification features:
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🔥</span>
                      <h3 className="font-semibold">Study Streaks</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Maintain your daily study streak and earn rewards
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🏆</span>
                      <h3 className="font-semibold">Achievement Badges</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Unlock badges as you reach study milestones
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">📊</span>
                      <h3 className="font-semibold">Progress Analytics</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Track your learning journey with detailed insights
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold">You're All Set! 🎉</h2>
                <div className="space-y-4">
                  <p className="text-lg text-gray-600 dark:text-gray-300">Here's what you can do next:</p>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Upload your first study material</span>
                    </li>
                    <li className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Try the AI chat assistant</span>
                    </li>
                    <li className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Set your study goals</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-end">
            <Button onClick={nextStep} size="lg">
              {step === totalSteps ? (
                <>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

