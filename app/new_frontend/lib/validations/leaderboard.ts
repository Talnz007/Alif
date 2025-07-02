import { z } from 'zod'

// Define the schema for validating leaderboard entries
export const leaderboardEntrySchema = z.object({
  id: z.string(),
  username: z.string(),
  points: z.number(),
  rank: z.number().optional(),
  avatar_url: z.string().nullable().optional(),
  isFriend: z.boolean().optional(),
  isLocal: z.boolean().optional(),
})

export const leaderboardSchema = z.array(leaderboardEntrySchema)

// Validation helper function
export function validateLeaderboardData(data: unknown) {
  const result = leaderboardSchema.safeParse(data)

  if (result.success) {
    return {
      valid: true,
      data: result.data,
      error: null
    }
  } else {
    console.error('Leaderboard validation error:', result.error)
    return {
      valid: false,
      data: [],
      error: result.error
    }
  }
}