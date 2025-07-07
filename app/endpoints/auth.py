# app/api/endpoints/auth.py
from fastapi_limiter import FastAPILimiter
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
from datetime import timedelta
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
)
from app.core.config import settings
from app.models.user import UserCreate, UserResponse, UserLogin
from app.database.connection import supabase_db
from app.core.exception import CustomHTTPException
from app.core.uuid_helper import ensure_uuid

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_remote_address(request: Request) -> str:
    return request.client.host

@router.get("/protected-route")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"message": "Welcome to the protected route!", "user": current_user}

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate) -> Any:
    try:
        # Normalize username and email to lowercase for case-insensitive comparison
        normalized_username = user_data.username.lower()
        normalized_email = user_data.email.lower()

        # Check if user exists using case-insensitive search
        # First try using the ilike operator for case-insensitive comparison
        existing_user = supabase_db.table('users').select("*").or_(
            f"email.ilike.{normalized_email},username.ilike.{normalized_username}"
        ).execute()

        # If ilike isn't supported, fallback to direct lowercase comparison
        if not existing_user.data:
            existing_user = supabase_db.table('users').select("*").execute()
            # Manual case-insensitive filtering
            existing_user.data = [
                user for user in existing_user.data
                if user.get('email', '').lower() == normalized_email or
                   user.get('username', '').lower() == normalized_username
            ]

        if existing_user.data:
            raise CustomHTTPException(
                "Username or email already registered",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create user (store normalized lowercase versions of username and email)
        new_user = {
            "username": normalized_username,
            "email": normalized_email,
            "password": hashed_password
        }

        result = supabase_db.table('users').insert(new_user).execute()

        if not result.data:
            raise CustomHTTPException("Failed to create user")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": normalized_username}, expires_delta=access_token_expires
        )

        # Log activity
        await log_user_activity(result.data[0]['id'], "user_registration")

        return {
            "username": normalized_username,
            "email": normalized_email,
            "access_token": access_token
        }

    except Exception as e:
        raise CustomHTTPException(str(e))

@router.post("/login", response_model=UserResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        # Normalize username to lowercase for case-insensitive login
        normalized_username = form_data.username.lower()
        print(f"Received username: {form_data.username} (normalized to {normalized_username})")
        print(f"Received password: {form_data.password}")

        # Try case-insensitive search first using ilike
        user_result = supabase_db.table('users').select("*").ilike("username", normalized_username).execute()

        # If ilike isn't supported or no results, try alternative case-insensitive approach
        if not user_result.data:
            # Get all users and filter manually by lowercase username
            all_users = supabase_db.table('users').select("*").execute()
            user_result.data = [
                user for user in all_users.data
                if user.get('username', '').lower() == normalized_username or
                   user.get('email', '').lower() == normalized_username
            ]

        print(f"User query result: {user_result.data}")

        if not user_result.data:
            raise CustomHTTPException(
                "Incorrect username or password",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        user = user_result.data[0]

        # Verify password
        if not verify_password(form_data.password, user["password"]):
            print("Password verification failed")  # Log password verification issue
            raise CustomHTTPException(
                "Incorrect username or password",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Create access token using the normalized username
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        print(f"Generated access token: {access_token}")

        # Log user activity
        await log_user_activity(user['id'], "user_login")

        return {
            "username": user["username"],
            "email": user["email"],
            "access_token": access_token
        }

    except Exception as e:
        print(f"Login error: {e}")  # Log any exceptions
        raise CustomHTTPException(str(e))

async def log_user_activity(user_id: str, activity_type: str, metadata: dict = None) -> None:
    """Log user activity to the database"""
    try:
        # Convert user_id to valid UUID format
        valid_uuid = ensure_uuid(user_id)

        insert_data = {
            "user_id": str(valid_uuid),  # Convert UUID to string for Supabase
            "activity_type": activity_type
        }
        if metadata:
            insert_data["metadata"] = metadata  # Store metadata as a JSON/object column in your DB

        supabase_db.table('user_activities').insert(insert_data).execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to log activity: {str(e)}")