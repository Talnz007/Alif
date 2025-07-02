export async function checkAndAwardBadges(userId: string) {
  try {
    console.log('🎯 Checking badges for user:', userId)
    
    const response = await fetch(`/api/users/${userId}/badges/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityType: 'retrospective_check',
        metadata: {}
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to check badges')
    }
    
    const result = await response.json()
    console.log('🏆 Badge check result:', result)
    
    return result
  } catch (error) {
    console.error('❌ Error checking badges:', error)
    return { success: false, newBadges: [] }
  }
}