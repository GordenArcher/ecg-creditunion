# ECG Credit Union

A Credit Union system with backend API, web frontend, and mobile staff application designed for managing savings, loans, wallets, and staff operations.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv un_env

# Activate (macOS/Linux)
source un_env/bin/activate
# Windows: un_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
start redis server

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

### 2. Web Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

---

### 3. Mobile App Setup

```bash
cd mobile

npm install
npx expo start
```

---

## Development URLs

* Backend API → http://localhost:8000
* Web Frontend → http://localhost:5173
* Mobile App → Expo Dev Server

---

## Project Structure

```
ecg_creditUnion/
│
├── backend/        # Django REST API & business logic
├── frontend/       # Web React application
├── mobile/         # React Native / Expo staff mobile app
├── .gitignore
└── README.md
```

---

## Core Features

### Authentication & Security

* Staff login with bearer tokens
* First-time password setup
* Password change flow
* 2FA-ready architecture
* Token refresh handling
* Secure logout with token invalidation

### Financial Operations

* Wallet management
* Savings accounts with interest rates
* Loan application & tracking
* Loan repayment system
* Transaction history & statements

### Staff Experience

* Mobile-first workflow
* Profile management
* Balance overview
* Activity tracking

---

## Architecture Overview

The system follows a layered architecture:

```
Mobile/Web Clients
        ↓
REST API (Django)
        ↓
Business Logic Layer
        ↓
Database
```

### Backend Responsibilities

* Authentication & authorization
* Business rules enforcement
* Financial calculations
* Data integrity & auditing

### Frontend/Mobile Responsibilities

* UI/UX
* Secure API communication
* Session persistence
* User workflows

---

## Authentication Flow

1. Staff logs in with credentials
2. Backend issues access + refresh tokens
3. Tokens stored securely on client
4. Axios attaches bearer token automatically
5. Expired access tokens trigger refresh
6. Invalid refresh → automatic logout

Special flows:

* First-time login → forced password setup
* Password update → token rotation

---

## API Overview

Example endpoint categories:

All API requests go through the `/api/v1` endpoint.

/users/auth/        → login, logout, token handling
/users/profile/     → profile management
/credit_union/wallets/           → balance & transactions
/credit_union/loans/             → loan lifecycle
/credit_union/savings/           → interest & account management
/credit_union/statements/        → transaction history

All endpoints require authenticated access unless stated otherwise.

---

## Environment Setup

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=your-db-url
```

---

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

### Mobile (.env)

```env
EXPO_PUBLIC_BACKEND_API_URL=http://localhost:8000/api/v1
```

---

## Useful Commands

### Backend

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

### Mobile

```bash
npx expo start
```

---

## Deployment Notes

Backend:

* Use environment variables in production
* Enable HTTPS
* Configure database backups
* Set DEBUG=False

Frontend/Mobile:

* Update API URLs
* Build optimized bundles
* Secure token storage

---

## Troubleshooting

Common issues:

### Backend won’t start

* Ensure migrations are applied
* Check database connection
* Verify .env values

### Mobile cannot reach API

* Confirm backend is running
* Check API base URL
* Verify network/firewall access

### Authentication issues

* Clear stored tokens
* Re-login

- Check backend logs

---

## Contribution Guide

1. Create a feature branch
2. Write clean, tested code
3. Follow naming conventions
4. Submit pull request

---

## Notes

* Backend handles authentication, loans, savings, and transactions
* Frontend is admin/web focused
* Mobile app is staff-focused
* Designed for scalability & modular growth

---

## Contact

For support, security concerns, or questions:

* Open an issue in the repository
* Email: **[your-email@example.com](mailto:your-email@example.com)**
