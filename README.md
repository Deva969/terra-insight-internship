## Project Structure

```text
terra-insight-internship/
│
├── backend/
└── frontend/
````

---
## Frontend Setup and Run

Open a new terminal and go to frontend folder:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---
## Backend Setup and Run

Go to backend folder:

```bash
cd backend
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run backend server:

```bash
python -m uvicorn app.main:app --reload
```

Backend will run on:

```text
http://127.0.0.1:8000
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

Run backend tests:

```bash
python -m pytest
```

---

````

