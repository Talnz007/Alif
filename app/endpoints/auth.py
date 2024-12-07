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


router = APIRouter(prefix="/auth", tags=["authentication"])


def get_remote_address(request: Request) -> str:
    return request.client.host


@router.get("/protected-route")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"message": "Welcome to the protected route!", "user": current_user}

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate) -> Any:
    try:
        # Check if user exists
        existing_user = supabase_db.table('users').select("*").or_(
            f"email.eq.{user_data.email},username.eq.{user_data.username}"
        ).execute()

        if existing_user.data:
            raise CustomHTTPException(
                "Username or email already registered",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create user
        new_user = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password
        }

        result = supabase_db.table('users').insert(new_user).execute()

        if not result.data:
            raise CustomHTTPException("Failed to create user")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data.username}, expires_delta=access_token_expires
        )

        # Log activity
        await log_user_activity(result.data[0]['id'], "user_registration")

        return {
            "username": user_data.username,
            "email": user_data.email,
            "access_token": access_token
        }

    except Exception as e:
        raise CustomHTTPException(str(e))


@router.post("/login", response_model=UserResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        print(f"Received username: {form_data.username}")
        print(f"Received password: {form_data.password}")

        # Fetch user from the database
        user_result = supabase_db.table('users').select("*").eq("username", form_data.username).execute()
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

        # Create access token
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



async def log_user_activity(user_id: str, activity_type: str) -> None:
    """Log user activity to the database"""
    try:
        supabase_db.table('user_activities').insert({
            "user_id": user_id,
            "activity_type": activity_type
        }).execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to log activity: {str(e)}")