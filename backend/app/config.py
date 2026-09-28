"""All configuration comes from environment variables (12-factor style).

The same image runs locally, in staging and in production — only the env changes.
"""

import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/devops101")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
APP_ENV = os.getenv("APP_ENV", "local")
APP_VERSION = os.getenv("APP_VERSION", "dev")
