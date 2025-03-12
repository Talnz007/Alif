"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { File, Calendar, TrendingUp } from "lucide-react"
import { AssignmentData } from "./dashboard"

export default function AssignmentStats({ data }: { data: AssignmentData | null }) {
  const assignmentData = data || {
    totalCompleted: 0,
    averageScore: 0,
    currentStreak: 0,
    recentAssignments: []
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-md font-medium">Assignment Statistics</CardTitle>
        <File className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Streak display */}
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm font-medium mr-2">Assignment Streak:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {assignmentData.currentStreak} days
            </Badge>
          </div>

          {/* Recent assignments */}
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Assignments</h4>
            {assignmentData.recentAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">No recent assignments found.</p>
            ) : (
              <div className="space-y-3">
                {assignmentData.recentAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium text-sm">{assignment.title}</h5>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(assignment.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Badge className={`${
                          assignment.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          assignment.score >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                        }`}>
                          {assignment.score}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={assignment.score} className="h-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Tap to view all assignments */}
          <div className="mt-2 text-center">
            <a 
              href="/assignments" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all assignments
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}