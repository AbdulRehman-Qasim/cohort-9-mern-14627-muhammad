# Memoora - MERN Notes App

## 1. Project Overview
Memoora is a full-stack Notes application built with the MERN stack (MongoDB replaced with PostgreSQL via Prisma). It allows users to securely register, log in, and manage their personal notes with a rich text editor.

## 2. Features
- **User Authentication:** Secure signup and login with JWT and HTTP-only cookies.
- **Personalized Notes:** Create, read, update, and delete (CRUD) user-specific notes.
- **Rich Text Editing:** Format notes with bold, italic, headings, lists, alignments, and strikethrough.
- **Real-time Updates:** Instant UI updates via Socket.io when notes are modified.
- **Data Export/Import:** Export notes to CSV and import from CSV.
- **Form Validation:** Strict input validation using Zod (Frontend) and Express-Validator (Backend).
- **Responsive UI:** Clean, modern interface tailored for both desktop and mobile viewing.

## 3. Tech Stack
**Frontend:**
- React 19 (Vite)
- React Router DOM
- Zod (Validation)
- DOMPurify (Sanitization)
- Jest & React Testing Library
- Socket.io Client

**Backend:**
- Node.js & Express
- PostgreSQL (via Prisma ORM)
- JSON Web Tokens (JWT) & bcrypt
- Pino (Logging)
- Mocha & Chai (Testing)
- Socket.io

## 4. Project Structure
The repository is split into two main directories:
- `frontend/` - Contains the Vite/React application, UI components, pages, and frontend tests.
- `backend/` - Contains the Node.js API, Prisma schema, controllers, routes, and backend tests.

## 5. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (e.g., Supabase or local instance)

## 6. Installation & Setup
Both the frontend and backend manage their own dependencies via separate `package.json` files.

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd 10Pearls_Project
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

## 7. Environment Variables
You need to configure environment variables for both the backend and frontend. Use the provided `.env.example` files as templates.

**Backend (`backend/.env`):**
- `PORT`: API port (default: 5000)
- `NODE_ENV`: Application environment (development/production)
- `LOG_LEVEL`: Logging verbosity (e.g., debug, info)
- `DATABASE_URL`: PostgreSQL connection string (Transaction pooler)
- `DIRECT_URL`: PostgreSQL direct connection string (For Prisma migrations)
- `JWT_SECRET`: Secret key for signing tokens
- `JWT_EXPIRES_IN`: Token expiration (e.g., 7d)
- `FRONTEND_URL`: URL of the frontend application (for CORS)

**Frontend (`frontend/.env`):**
- `VITE_API_BASE_URL`: URL of the backend API (default: http://localhost:5000/api)

## 8. Running the Application

**Start the Backend:**
```bash
cd backend
# Run Prisma migrations to set up the database schema
npx prisma db push
# Start the development server
npm run dev
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 9. Testing
Testing is configured separately for the frontend and backend.

**Backend Testing (Mocha/Chai):**
```bash
cd backend
npm test
```

**Frontend Testing (Jest):**
```bash
cd frontend
npm test
```

## 10. Code Quality
The project utilizes **SonarQube** for continuous inspection of code quality. Configuration is provided via the `sonar-project.properties` file in the root directory. To run the analysis, ensure the SonarScanner is installed and configured with your local or cloud SonarQube instance.

## 11. Git Workflow
- Development occurs on `feature/*` branches branching off from `develop`.
- Pull Requests are created to merge features back into `develop`.
- `main` serves as the production-ready branch.

## 12. Current Status
The core application features (Authentication, Notes CRUD, Rich Text Editor, CSV Export/Import) are fully implemented and tested.
