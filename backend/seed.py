"""Seed script for the event_plan database.

Creates minimal `users` and `tasks` tables if they don't exist and inserts
one sample user and a few sample tasks. Safe to re-run (checks for existing
email and tasks by title).
"""
import sys
import os

# Ensure project root is on sys.path so `import backend...` works when
# running this script from the `backend/` folder.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.Database import get_db_connection
import bcrypt
from datetime import datetime, timedelta


def ensure_tables(conn):
    cur = conn.cursor()
    try:
        cur.execute(
            """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        )

        cur.execute(
            """
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(32) DEFAULT 'pending',
            due_date DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        )
        conn.commit()
    finally:
        cur.close()


def get_or_create_user(conn, email, password):
    cur = conn.cursor()
    try:
        cur.execute('SELECT id FROM users WHERE email = %s', (email,))
        row = cur.fetchone()
        if row:
            return row[0]

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute('INSERT INTO users (email, password) VALUES (%s, %s)', (email, hashed))
        conn.commit()
        return cur.lastrowid
    finally:
        cur.close()


def ensure_task(conn, user_id, title, description=None, status='pending', due=None):
    cur = conn.cursor()
    try:
        cur.execute('SELECT id FROM tasks WHERE user_id = %s AND title = %s', (user_id, title))
        if cur.fetchone():
            return
        cur.execute('INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (%s, %s, %s, %s, %s)',
                    (user_id, title, description, status, due))
        conn.commit()
    finally:
        cur.close()


def main():
    conn = get_db_connection()
    try:
        ensure_tables(conn)

        user_email = 'seed@local'
        user_password = 'password123'
        user_id = get_or_create_user(conn, user_email, user_password)
        print(f'User id: {user_id} (email={user_email}, password={user_password})')

        now = datetime.utcnow()
        ensure_task(conn, user_id, 'Welcome Task', 'This is your first task', 'pending', now + timedelta(days=3))
        ensure_task(conn, user_id, 'Plan Venue', 'Find and book a venue', 'in_progress', now + timedelta(days=14))
        ensure_task(conn, user_id, 'Send Invites', 'Email invites to guests', 'pending', now + timedelta(days=7))

        print('Seeding complete.')
    finally:
        conn.close()


if __name__ == '__main__':
    main()
"""Seed sample data for local development.

Run from the project root:
    python backend/seed.py
"""
import os
import sys
from datetime import datetime, timedelta

import bcrypt
from dotenv import load_dotenv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.Database import get_db_connection


DEMO_USER = {
    "email": "demo@planora.app",
    "password": "password123",
}


def hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())


def ensure_user(cursor, email: str, password: str) -> int:
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(
        "INSERT INTO users (email, password) VALUES (%s, %s)",
        (email, hash_password(password)),
    )
    return cursor.lastrowid


def seed_tasks(cursor, user_id: int) -> int:
    today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    tasks = [
        {
            "title": "Prepare product launch checklist",
            "description": "Confirm owners, deadlines, and approval steps before launch week.",
            "status": "pending",
            "due_date": today + timedelta(days=1),
        },
        {
            "title": "Review onboarding flow",
            "description": "Walk through first-run screens and capture friction points for design QA.",
            "status": "completed",
            "due_date": today - timedelta(days=1),
        },
        {
            "title": "Plan sprint priorities",
            "description": "Align engineering, design, and product work for the next planning cycle.",
            "status": "pending",
            "due_date": today + timedelta(days=3),
        },
        {
            "title": "Update customer feedback board",
            "description": "Group recent feedback by theme and mark follow-up items.",
            "status": "completed",
            "due_date": today - timedelta(days=3),
        },
        {
            "title": "Draft weekly stakeholder update",
            "description": "Summarize progress, risks, and decisions needed from leadership.",
            "status": "pending",
            "due_date": today + timedelta(days=5),
        },
        {
            "title": "Clean up backlog labels",
            "description": "Remove duplicate labels and make status filters easier to scan.",
            "status": "pending",
            "due_date": None,
        },
    ]

    inserted = 0
    for task in tasks:
        cursor.execute(
            "SELECT id FROM tasks WHERE user_id = %s AND title = %s",
            (user_id, task["title"]),
        )
        if cursor.fetchone():
            continue

        cursor.execute(
            """
            INSERT INTO tasks (user_id, title, description, status, due_date)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                task["title"],
                task["description"],
                task["status"],
                task["due_date"],
            ),
        )
        inserted += 1

    return inserted


def main():
    load_dotenv()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        user_id = ensure_user(cursor, DEMO_USER["email"], DEMO_USER["password"])
        inserted_tasks = seed_tasks(cursor, user_id)
        conn.commit()
        print("Seed complete")
        print(f"Demo login: {DEMO_USER['email']} / {DEMO_USER['password']}")
        print(f"Inserted tasks: {inserted_tasks}")
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
