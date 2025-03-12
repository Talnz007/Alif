"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BrainCircuit, FileAudio, Sparkles, Star } from "lucide-react"

const features = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Quiz Generation",
    description: "Transform any study material into interactive quizzes instantly",
  },
  {
    icon: FileAudio,
    title: "Lecture Digest",
    description: "Convert audio lectures into comprehensive, easy-to-review notes",
  },
  {
    icon: Sparkles,
    title: "Smart Assignment Help",
    description: "Get intelligent assistance with assignments and homework",
  },
]

const testimonials = [
  {
    name: "Sarah K.",
    role: "Computer Science Student",
    content: "Alif has completely transformed how I study. The AI-generated quizzes are incredibly helpful!",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Michael R.",
    role: "Engineering Major",
    content: "The lecture summarization feature saves me hours of note-taking time.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Emily L.",
    role: "Medical Student",
    content: "The personalized study paths have significantly improved my exam scores.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
]

const stats = [
  { number: "50K+", label: "Active Students" },
  { number: "1M+", label: "Quizzes Generated" },
  { number: "95%", label: "Success Rate" },
]

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 pt-20 pb-16 text-center"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Transform Your Learning Journey with AI
        </motion.h1>
        <motion.p variants={itemVariants} className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Harness the power of artificial intelligence to enhance your study experience. Generate quizzes, summarize
          lectures, and get instant help with assignments.
        </motion.p>
        <motion.div variants={itemVariants} className="flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.number}</h3>
              <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white"
        >
          Features that Set Us Apart
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              <feature.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white"
        >
          What Our Users Say
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{testimonial.content}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white"
        >
          Choose Your Plan
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Free</h3>
            <p className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">$0</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-green-500" /> Basic quiz generation
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-green-500" /> Limited summaries
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-green-500" /> Community support
              </li>
            </ul>
            <Button className="w-full">Get Started</Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-6 bg-blue-600 dark:bg-blue-700 rounded-lg shadow-lg transform scale-105"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Pro</h3>
            <p className="text-3xl font-bold mb-6 text-white">$19/mo</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-white">
                <Star className="w-5 h-5 mr-2 text-yellow-400" /> Unlimited quiz generation
              </li>
              <li className="flex items-center text-white">
                <Star className="w-5 h-5 mr-2 text-yellow-400" /> Full lecture summaries
              </li>
              <li className="flex items-center text-white">
                <Star className="w-5 h-5 mr-2 text-yellow-400" /> Priority support
              </li>
              <li className="flex items-center text-white">
                <Star className="w-5 h-5 mr-2 text-yellow-400" /> Advanced analytics
              </li>
            </ul>
            <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">Get Pro</Button>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Enterprise</h3>
            <p className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">Custom</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-purple-500" /> Custom integration
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-purple-500" /> Dedicated support
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-purple-500" /> Custom features
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <Star className="w-5 h-5 mr-2 text-purple-500" /> SLA guarantee
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <motion.div variants={itemVariants} className="bg-blue-600 dark:bg-blue-700 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of students already using Alif</p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started Now
            </Button>
          </Link>
        </motion.div>
      </motion.section>
    </div>
  )
}

