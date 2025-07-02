'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">{error.message || 'An unexpected error occurred'}</p>
      <Button
        onClick={() => reset()}
        variant="default"
      >
        Try again
      </Button>
    </div>
  )
}