# Peer Kudos Wall

A full-stack internal employee recognition platform where team members can
appreciate each other by sending Kudos points, celebrating company values,
reacting to Kudos, and viewing monthly leaderboards.

## Features

### Authentication
- User signup and login
- JWT authentication
- Access and refresh token flow
- HTTP-only refresh token cookie
- Email verification simulation
- Forgot password
- Reset password
- Logout

### Kudos
- Give Kudos to colleagues
- Points: 10, 20, 50
- Company values:
  - Teamwork
  - Customer Obsession
  - Innovation
- Monthly giving allowance
- Self-gifting prevention
- Insufficient allowance validation
- Atomic point transfer

### Social Feed
- View recent Kudos
- Sender and receiver information
- Points and company values
- Pagination / infinite scrolling
- Reactions:
  - +1
  - 👏
  - 🔥
- Optimistic reaction UI

### Profile
- User profile
- Department
- Giving allowance
- Earned points
- Kudos received
- Kudos sent
- Badges

### Leaderboard
- Monthly leaderboard
- Department filtering
- Engineering
- Design
- Marketing
- Sales

### Administration / Background
- Monthly allowance reset command
- Seed/demo data command

## Technology Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- Tailwind CSS
- Coss UI

### Backend
- Python
- Django
- Django REST Framework
- JWT Authentication

### Database
- PostgreSQL

### API Documentation
- Swagger / OpenAPI

## Project Architecture

Frontend (React)
        |
        | REST API
        ↓
Backend (Django REST Framework)
        |
        ↓
PostgreSQL

## Repository Structure

peer-kudos-wall/
├── frontend/
├── backend/
├── README.md
└── .gitignore

## Prerequisites

- Python 3.x
- Node.js
- npm
- PostgreSQL
- Git

## Backend Setup

### 1. Clone repository

git clone YOUR_GITHUB_REPOSITORY_URL

cd peer-kudos-wall/backend

### 2. Create virtual environment

python -m venv venv

### Windows

venv\Scripts\activate

### Linux / macOS

source venv/bin/activate

### 3. Install dependencies

pip install -r requirements.txt

### 4. Configure environment variables

Create a `.env` file based on `.env.example`.

Example:

SECRET_KEY=your_secret_key
DEBUG=True

DB_NAME=your_database
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=7

### 5. Create PostgreSQL database

Create a PostgreSQL database and update the database credentials
in the `.env` file.

### 6. Run migrations

python manage.py makemigrations
python manage.py migrate

### 7. Create admin user

python manage.py createsuperuser

### 8. Seed demo data

python manage.py seed

### 9. Run backend

python manage.py runserver

Backend:

http://127.0.0.1:8000/

## Frontend Setup

### 1. Open frontend

cd ../frontend

### 2. Install dependencies

npm install

### 3. Configure environment variables

Create `.env` from `.env.example`.

Example:

VITE_API_URL=http://127.0.0.1:8000/api

### 4. Start frontend

npm run dev

Frontend:

http://localhost:5173

## 5. API Documentation

The backend provides Swagger/OpenAPI documentation for testing and
understanding the available REST APIs.

Local Swagger:

http://127.0.0.1:8000/api/docs/

The documentation includes:

- Authentication APIs
- User APIs
- Kudos APIs
- Reaction APIs
- Leaderboard APIs
- Request parameters
- Request bodies
- Response schemas
- Authentication requirements
  
### Authentication

POST /api/auth/signup/
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/refresh/
POST /api/auth/forgot-password/
POST /api/auth/reset-password/

### Users

GET /api/users/
GET /api/profile/

### Kudos

POST /api/kudos/
GET /api/kudos/

### Reactions

POST /api/kudos/{id}/reactions/
DELETE /api/kudos/{id}/reactions/

### Leaderboard

GET /api/leaderboard/
GET /api/leaderboard/?department=Engineering

## Monthly Allowance Reset

The monthly allowance can be reset using:

python manage.py reset_allowances

This resets the giving allowance to 100 for active users.

## Environment Variables

Do not commit `.env` files or secrets.

Required variables:

- SECRET_KEY
- DEBUG
- DB_NAME
- DB_USER
- DB_PASSWORD
- DB_HOST
- DB_PORT
- VITE_API_URL

See `.env.example` files for configuration.

## Security

- Passwords are hashed using Django's authentication system.
- Refresh tokens use HTTP-only cookies.
- Secrets are stored in environment variables.
- Protected APIs require authentication.
- Self-gifting is prevented.
- Point transfers use database transactions.
- Input validation is implemented on the backend.

## Assumptions / Limitations

- Email verification is simulated for assessment purposes.
- Password reset email delivery is simulated if no external email service is configured.
- Monthly allowance reset is implemented as a management command and can be scheduled in deployment.
- Badge functionality may be extended in future versions.

## Third-Party Libraries

This project uses third-party libraries such as Django REST Framework,
JWT authentication, Axios, Tailwind CSS and Coss UI.

Each library is used for its respective purpose in authentication,
API development, frontend communication and UI development.

## Future Improvements

- Real email verification
- Real password reset emails
- Notifications
- Advanced badges
- Admin analytics
- Real-time Kudos notifications
- More detailed leaderboard analytics

## Author

GitHub: https://github.com/Nilesh555
LinkedIn: https://www.linkedin.com/in/chudasama-nilesh-7bb647275/
