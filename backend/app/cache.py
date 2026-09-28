"""Redis access using redis-py. The client connects lazily on first use."""

import redis

from app import config

client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)


def count_visit() -> int:
    """Atomically add 1 to the visit counter and return the new value."""
    return client.incr("visits")
