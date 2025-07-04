"use client"

import { useState } from "react";
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen, Brain, BarChart, Users, CheckCircle, MessageCircle, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Import your existing components
import { HeroAnimation } from "@/components/hero-animation"
import { FeatureCard } from "@/components/feature-card"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { PricingTable } from "@/components/pricing-table"
import { InteractiveDemo } from "@/components/interactive-demo"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-indigo-50/50 via-background to-background dark:from-indigo-950/20">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm font-medium mb-2">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
                Introducing Alif
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-orange-500">
                  Smarter Learning,
                </span>
                <br />
                Less Noise.
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px]">
                Your notes, PDFs, and lectures — turned into videos, flashcards, and quizzes.
                <br />
                No more switching tabs. Just focus and learn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600"
                >
                  <Link href="/register" target="_blank">
                    Sign Up for Early Access <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
                >
                  <Link href="#demo">Try Demo</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>Clarity over clutter</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Email Registration Section */}
      <EmailRegistrationSection />

      {/* Tools Section */}
      <section id="tools" className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">What Can Alif Do?</h2>
            <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
              Transform your study materials into active learning experiences with our AI-powered tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="AI-Powered Summarizer"
              description="Upload PDFs or lecture notes and get clear, concise summaries in seconds. Perfect for quick revision before exams."
              gradient="from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30"
              iconColor="text-indigo-600"
            />
            <FeatureCard
              icon={<Brain className="h-10 w-10" />}
              title="Explainer Video Generator"
              description="Turn your notes into short, animated videos with voice-overs. Make complex concepts easy to understand."
              gradient="from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
              iconColor="text-orange-600"
            />
            <FeatureCard
              icon={<BarChart className="h-10 w-10" />}
              title="Smart Flashcard Creator"
              description="AI automatically creates spaced-repetition flashcards from your content to help you memorize key concepts."
              gradient="from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
              iconColor="text-purple-600"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Quiz Generator"
              description="Instantly generate concept-based quizzes from any learning material. Test your knowledge and identify weak areas."
              gradient="from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30"
              iconColor="text-green-600"
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="Assignment Assistant"
              description="Get AI help to understand assignment questions and learn effective approaches to tackle complex problems."
              gradient="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
              iconColor="text-blue-600"
            />
            <FeatureCard
              icon={<MessageCircle className="h-10 w-10" />}
              title="AI Chat Tutor"
              description="Ask contextual questions and get personalized explanations on your study content. Like having a tutor available 24/7."
              gradient="from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30"
              iconColor="text-rose-600"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">Experience Interactive Learning</h2>
            <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
              Try our interactive demos to see how Alif transforms your study materials into engaging learning
              experiences.
            </p>
          </div>

          <InteractiveDemo />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">What Our Learners Say</h2>
            <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
              Join thousands of students already simplifying how they learn with Alif.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
              Choose the plan that fits your learning needs. Start free and upgrade as you grow.
            </p>
          </div>

          <PricingTable />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-orange-500 text-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tighter">Ready to Transform Your Learning?</h2>
              <p className="text-xl max-w-[600px] text-white/90">
                Join thousands of students who are getting ready to achieve their academic goals with Alif.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild className="bg-white text-indigo-600 hover:bg-gray-100">
                <Link href="/register" target="_blank">
                  Sign Up for Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gray-900 text-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <div className="relative h-8 w-8 flex-shrink-0">
                  <Image src="alif-logo-white.jpeg" alt="الف" fill className="object-contain" />
                </div>
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-orange-400">
                  Alif
                </span>
              </Link>
              <p className="text-gray-300 mb-4">Smarter learning, less noise.</p>
              <div className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-orange-400">
                Built with 💙 in Pakistan
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-white">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#tools" className="text-sm text-gray-300 hover:text-indigo-400 transition-colors">
                    AI Tools
                  </Link>
                </li>
                <li>
                  <Link href="#demo" className="text-sm text-gray-300 hover:text-indigo-400 transition-colors">
                    Interactive Demo
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-sm text-gray-300 hover:text-indigo-400 transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-white">Connect</h3>
              <div className="mb-4">
                <Link
                  href="https://www.linkedin.com/company/alifedu"
                  className="text-gray-300 hover:text-indigo-400 transition-colors inline-flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-5 w-5 mr-2" />
                  <span className="text-sm">LinkedIn</span>
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h3 className="font-medium mb-3 text-white">📱 Explore Alif Links</h3>
              <div className="relative w-32 h-32 mb-4">
                <Image
                  src="/linktree-qr.png"
                  alt="Alif Linktree QR Code"
                  fill
                  className="object-contain rounded-lg bg-white p-2"
                />
              </div>
              <p className="text-xs text-gray-400 text-center md:text-left">Scan to access all our social links</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Alif. All rights reserved.</p>
            {/*<div className="flex items-center space-x-4">*/}
            {/*  <Link href="/terms" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">*/}
            {/*    Terms*/}
            {/*  </Link>*/}
            {/*  <Link href="/privacy" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">*/}
            {/*    Privacy*/}
            {/*  </Link>*/}
            {/*</div>*/}
          </div>
        </div>

        {/* Floating QR Code for Mobile */}
        <div className="fixed bottom-4 right-4 md:hidden z-40">
          <div className="bg-white rounded-lg p-2 shadow-lg border">
            <div className="relative w-16 h-16">
              <Image src="/linktree-qr.png" alt="Alif Links" fill className="object-contain" />
            </div>
            <p className="text-xs text-center text-gray-600 mt-1">Alif Links</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Email Registration Section Component
// Email Registration Section Component - simplified version without email input
function EmailRegistrationSection() {
  const router = useRouter();

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Join Our Early Access Program
            </h2>
            <p className="text-muted-foreground">
              Be among the first to experience Alif's full capabilities.
            </p>
          </div>

          <div className="w-full md:w-auto max-w-md text-center">
            <Button
              onClick={() => router.push('/register')}
              className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600 w-full sm:w-auto"
            >
              Get Early Access
            </Button>
            {/*<p className="mt-2 text-xs text-muted-foreground">*/}
            {/*  By signing up, you agree to our <Link href="/terms" className="underline hover:text-indigo-600">Terms</Link> and <Link href="/privacy" className="underline hover:text-indigo-600">Privacy Policy</Link>.*/}
            {/*</p>*/}
          </div>
        </div>
      </div>
    </section>
  );
}