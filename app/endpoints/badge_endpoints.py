from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.security import get_current_user
from app.services.badges_service import BadgeService
from app.services.badge_checker import BadgeChecker
from app.core.schemas import APIResponse
from app.core.app_logging import app_logger

router = APIRouter(prefix="/badges", tags=["Badges"])

badge_service = BadgeService()
badge_checker = BadgeChecker(badge_service)

@router.get("/", response_model=APIResponse)
async def get_user_badges(current_user=Depends(get_current_user)):
    if not current_user:
        result = badge_service.db.table('badges').select("*").execute()
        return APIResponse(
            success=True,
            message="Retrieved all available badges",
            data=result.data
        )
    badges = await badge_service.get_user_badges(current_user.id)
    return APIResponse(
        success=True,
        message=f"Retrieved {len(badges)} badges for user {current_user.id}",
        data=badges
    )

@router.post("/check-all", response_model=APIResponse)
async def check_all_badges(
    request: Request,
    current_user=Depends(get_current_user)
):
    body = await request.json()
    user_id = current_user.id if current_user else body.get("user_id")

    if not user_id:
        raise HTTPException(status_code=400, detail="No user ID provided or authenticated")

    app_logger.info(f"Running badge check for user: {user_id} with auth: {request.headers.get('Authorization')}")
    try:
        awarded_badges = await badge_checker.retrospective_check(user_id)
        return APIResponse(
            success=True,
            message=f"Awarded {len(awarded_badges)} new badges for user {user_id}",
            data=awarded_badges
        )
    except Exception as e:
        app_logger.error(f"Error in retrospective badge check for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check badges: {str(e)}"
        )

@router.get("/available", response_model=APIResponse)
async def get_available_badges():
    result = badge_service.db.table('badges').select("*").execute()
    return APIResponse(
        success=True,
        message=f"Retrieved {len(result.data)} badges",
        data=result.data
    )