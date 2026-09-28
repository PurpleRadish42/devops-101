"""DevOps 101 backend: a tiny FastAPI app with a visit counter (Redis) and a guestbook (Postgres)."""

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app import cache, config, db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()  # create tables on startup
    yield


app = FastAPI(title="DevOps 101 API", lifespan=lifespan)


class EntryIn(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    message: str = Field(min_length=1, max_length=200)


class EntryOut(EntryIn):
    id: int
    created_at: datetime


@app.get("/health")
def health():
    # Liveness/readiness probe: deliberately does NOT touch Postgres or Redis.
    return {"status": "ok"}


@app.get("/api/info")
def info():
    return {"env": config.APP_ENV, "version": config.APP_VERSION, "visits": cache.count_visit()}


@app.get("/api/guestbook", response_model=list[EntryOut])
def list_entries():
    return db.latest_entries(20)


@app.post("/api/guestbook", response_model=EntryOut, status_code=201)
def create_entry(entry: EntryIn):
    return db.add_entry(entry.name, entry.message)
