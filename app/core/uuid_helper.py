import re
import uuid

# UUID validation regex
UUID_REGEX = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', re.IGNORECASE)


def ensure_uuid(user_id):
    """
    Convert any user_id to a valid UUID
    This helps with frontend sending non-UUID values like "1"

    Args:
        user_id: String or integer ID value

    Returns:
        UUID object that can be used with PostgreSQL
    """
    if user_id is None:
        return uuid.UUID('00000000-0000-0000-0000-000000000000')

    # Convert to string
    id_str = str(user_id)

    # If already a valid UUID string, convert to UUID object
    if UUID_REGEX.match(id_str):
        return uuid.UUID(id_str)

    # For numeric IDs like "1", create a deterministic UUID
    if id_str.isdigit():
        padded_id = id_str.zfill(3)
        return uuid.UUID(f'00000000-0000-4000-a000-00000000{padded_id}')

    # For other strings, create a UUID based on the content
    return uuid.uuid5(uuid.NAMESPACE_DNS, id_str)