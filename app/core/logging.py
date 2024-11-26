import logging
from logging.handlers import RotatingFileHandler
import os

# Create a logger for the app
app_logger = logging.getLogger("app_logger")
app_logger.setLevel(logging.DEBUG)  # You can adjust the level based on your needs

# Create a formatter for log messages
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d')


# Log to file with rotation (logs will be kept for a certain number of days/size)
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, "app.log")
file_handler = RotatingFileHandler(log_file, maxBytes=10**6, backupCount=5)  # 1MB max size, keep 5 backups
file_handler.setFormatter(formatter)

# Also log to the console
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

# Add handlers to the logger
app_logger.addHandler(file_handler)
app_logger.addHandler(console_handler)
