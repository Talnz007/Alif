from app.database.connection import supabase_db

user_id = "4a8881cd-1568-4234-a24b-d9e90b1c19ad"
activity_type = "quiz_completed"

existing_user = (
    supabase_db
    .table('user_activities')
    .select("*")
    .eq('activity_type', activity_type)
    .execute()
)

print(existing_user.data[0])