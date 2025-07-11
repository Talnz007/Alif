from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from app.services.user_service import UserService



# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
user_service = UserService()


# Dependency to get the current user based on the token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

        # NEW: Normalize username to lowercase for consistent lookups
        username = username.lower()

        # NEW: Fetch the full user object - ensure case insensitive lookup
        user = await user_service.get_user_by_username(username)
        if user is None:
            raise credentials_exception

        return user  # Return full user object with UUID

    except JWTError:
        raise credentials_exception


# Function to create an access token for a user
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    # FIX: Convert to UNIX timestamp
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# Password verification and hashing functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)  # Verifies if the plain password matches the hashed one


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)  # Hashes the password using bcrypt
