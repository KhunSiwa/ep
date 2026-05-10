# Event Planner

Backend (Flask) and Frontend (Vite React).

Backend setup:

- Create a virtualenv and install:

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

- Create a MySQL database `event_plan` and the tables `users` and `tasks` (see below).
- Copy `.env.example` to `.env` and update.
- Run the server:

```bash
python backend/app.py
```

Frontend setup:

```bash
cd frontend
npm install
npm run dev
```

Database schema (MySQL):

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARBINARY(255) NOT NULL
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  due_date DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
# ep
