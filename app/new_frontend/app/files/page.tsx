"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function FilesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the assignments page which contains the file manager
    router.push('/assignments')
  }, [router])

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-gray-500">Redirecting to file manager...</p>
      </div>
    </div>
  )
}