```markdown
# ECG Credit Union

A Credit Union system with backend API and frontend interface.

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

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development URLs
- Backend API: http://localhost:8000
- Frontend App: http://localhost:5173

## Project Structure
```
ecg_creditUnion/
├── backend/     # Django REST API
├── frontend/    # React frontend
└── README.md    # This file
```

## Environment Setup

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Useful Commands

### Backend
```bash
python manage.py runserver      # Start server
python manage.py makemigrations # Create migrations
python manage.py migrate        # Apply migrations
python manage.py test           # Run tests
```

### Frontend
```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Check code quality
```

## Contact
For support or questions, contact the development team.
```
