"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

export function PricingTable() {
  const [annual, setAnnual] = useState(true)

  const plans = [
    {
      name: "Free",
      description: "Start learning for free - perfect for trying out Alif",
      price: 0,
      currency: "PKR",
      features: [
        "20 AI summaries per month",
        "30 flashcards per month",
        "10 quizzes per month",
        "1 explainer video per month (with watermark)",
        "AI Study Buddy (3 chats per day)",
        "Community support",
      ],
      cta: "Sign Up for Early Access",
      popular: false,
      highlight: "Most Popular for Students",
    },
    {
      name: "Pro",
      description: "Ideal for serious students who want unlimited learning",
      price: annual ? 799 : 999,
      currency: "PKR",
      originalPrice: annual ? 999 : null,
      features: [
        "100 AI summaries per month",
        "200 flashcards per month",
        "40 quizzes per month",
        "5 HD explainer videos per month (no watermark)",
        "AI Study Buddy (unlimited chats)",
        "Priority email support",
        "Advanced quiz analytics",
      ],
      cta: "Sign Up for Early Access",
      popular: true,
      highlight: "Best Value",
    },
    {
      name: "Premium",
      description: "For power users who need everything unlimited",
      price: annual ? 1999 : 2499,
      currency: "PKR",
      originalPrice: annual ? 2499 : null,
      features: [
        "Unlimited summaries, flashcards & quizzes",
        "20 HD explainer videos per month",
        "AI Study Buddy with priority access",
        "Assignment Assistant (PDF-based help)",
        "Personalized study insights",
        "24/7 premium support",
        "Early access to new features",
        "Custom study schedules",
      ],
      cta: "Sign Up for Early Access",
      popular: false,
      highlight: "Everything Included",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-center items-center space-x-4">
        <Label htmlFor="annual-billing" className={annual ? "text-muted-foreground" : ""}>
          Monthly
        </Label>
        <Switch id="annual-billing" checked={annual} onCheckedChange={setAnnual} />
        <div className="flex items-center">
          <Label htmlFor="annual-billing" className={!annual ? "text-muted-foreground" : ""}>
            Annual
          </Label>
          <div className="ml-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Save 20%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            className={`rounded-xl border bg-card shadow-sm overflow-hidden ${
              plan.popular ? "border-primary md:scale-105 relative z-10" : ""
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {plan.popular && (
              <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-1">
                {plan.highlight}
              </div>
            )}

            <div className="p-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1.5 mb-4">{plan.description}</p>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground ml-1.5">/month</span>}
                </div>
                {annual && plan.originalPrice && (
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      {plan.currency} {plan.originalPrice}/month
                    </span>
                    <span className="text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                      Save {plan.currency} {(plan.originalPrice - plan.price) * 12}/year
                    </span>
                  </div>
                )}
                {plan.price === 0 && <p className="text-sm text-muted-foreground mt-1">No credit card required</p>}
              </div>

              <Button
                className={`w-full ${plan.popular ? "bg-primary" : ""}`}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>

            <div className="border-t p-6">
              <h4 className="font-medium mb-4">What's included:</h4>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center text-sm text-muted-foreground">
                Need help choosing? <HelpCircle className="h-4 w-4 ml-1" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Contact our team for a personalized recommendation based on your learning goals.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
