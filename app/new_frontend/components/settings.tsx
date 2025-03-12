"use client"

import React from "react"
import { SettingsIcon, Bell, Moon, Globe, Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export default function Settings() {
  const [notifications, setNotifications] = React.useState(true)
  const [language, setLanguage] = React.useState("en")
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-300 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
        <SettingsIcon className="mr-2" /> Settings
      </h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-800 dark:text-white">Notifications</span>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Moon className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-800 dark:text-white">Dark Mode</span>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-800 dark:text-white">Language</span>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-800 dark:text-white">Privacy</span>
          </div>
          <Button variant="outline">Manage Privacy Settings</Button>
        </div>
      </div>
    </div>
  )
}

