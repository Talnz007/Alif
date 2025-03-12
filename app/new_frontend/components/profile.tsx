"use client"

import { useState } from "react"
import { User, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UserProfile {
  name: string
  email: string
  phone: string
  subjects: string[]
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 234 567 8900",
    subjects: ["Mathematics", "Physics", "Computer Science"],
  })

  const [editing, setEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    // Here you would typically send the updated profile to your backend
    console.log("Saving profile:", profile)
    setEditing(false)
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
        <User className="mr-2" /> My Profile
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <Input name="name" value={profile.name} onChange={handleChange} disabled={!editing} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <Input
            name="email"
            type="email"
            value={profile.email}
            onChange={handleChange}
            disabled={!editing}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <Input
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={handleChange}
            disabled={!editing}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects</label>
          <div className="flex flex-wrap gap-2">
            {profile.subjects.map((subject, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
        {editing ? (
          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        ) : (
          <Button onClick={() => setEditing(true)} className="w-full">
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  )
}

