"""Postgres access using psycopg (v3). One short-lived connection per call keeps it simple."""

import psycopg
from psycopg.rows import dict_row

from app import config


def connect():
    return psycopg.connect(config.DATABASE_URL, row_factory=dict_row)


def init_db():
    """Create the guestbook table on startup if it does not exist yet."""
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS guestbook (
                id         SERIAL PRIMARY KEY,
                name       VARCHAR(40)  NOT NULL,
                message    VARCHAR(200) NOT NULL,
                created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
            )
            """
        )


def latest_entries(limit: int = 20):
    with connect() as conn:
        return conn.execute(
            "SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT %s",
            (limit,),
        ).fetchall()


def add_entry(name: str, message: str):
    with connect() as conn:
        return conn.execute(
            "INSERT INTO guestbook (name, message) VALUES (%s, %s) "
            "RETURNING id, name, message, created_at",
            (name, message),
        ).fetchone()
