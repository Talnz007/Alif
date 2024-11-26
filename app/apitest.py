from jose import jwt
from app.core.security import settings,get_current_user

def decode_token(token: str):
    try:
        decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_data
    except jwt.ExpiredSignatureError:
        print("Token has expired")
    except jwt.JWTError:
        print("Invalid token")

token_data = decode_token('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTczMjQ4MTAwM30.qu7CMH0atBErFP7ujFC9vi0vhbapBzwi2gKH2p_sze4')
print(token_data)

get_current_user('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTczMjQ4MTAwM30.qu7CMH0atBErFP7ujFC9vi0vhbapBzwi2gKH2p_sze4')