import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, FileText, Trophy, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to Alif</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Book className="mr-2" /> Study Assistant
            </CardTitle>
            <CardDescription>Generate quizzes, flashcards, and summaries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/study-assistant">
              <Button className="w-full">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2" /> Assignments
            </CardTitle>
            <CardDescription>Manage and get help with your assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/assignments">
              <Button className="w-full">
                View Assignments <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2" /> Progress
            </CardTitle>
            <CardDescription>Track your achievements and leaderboard position</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/progress">
              <Button className="w-full">
                Check Progress <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

