import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface CourseCardProps {
  title: string
  progress: number
  image: string
}

export function CourseCard({ title, progress, image }: CourseCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <Image src={image || "/placeholder.svg"} alt={title} layout="fill" objectFit="cover" />
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">{progress}% complete</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Continue Course</Button>
      </CardFooter>
    </Card>
  )
}
