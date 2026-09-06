# MPLADS Intelligence System

## Project Overview
The **MPLADS Intelligence System** is an advanced analytics and monitoring platform designed to oversee the Members of Parliament Local Area Development Scheme (MPLADS). It connects to official government data sources (eSAKSHI) to provide real-time intelligence, geographical distribution tracking, financial expenditure monitoring, and AI-driven anomaly detection for scheme utilization.

## Problem Being Solved
Monitoring the allocation, recommendation, sanction, and expenditure of MPLADS funds across hundreds of MPs, thousands of constituencies, and tens of thousands of individual works is complex. This platform consolidates this scattered data into a single, cohesive dashboard that enables decision-makers, auditors, and administrators to identify bottlenecks, track project completion, and ensure transparent financial impact.

## Key Features
- **National Dashboard Overview:** High-level metrics on total allocations, works sanctioned, and financial disbursements.
- **MP Monitoring & Profiling:** Track individual MP performance across Lok Sabha and Rajya Sabha, including fund utilization and project completion ratios.
- **Expenditure Intelligence:** Financial analysis highlighting the gap between fund allocation and actual ground expenditure.
- **Geographical Analytics:** Interactive geospatial visualization of fund distribution across states and constituencies.
- **AI Intelligence & Anomaly Detection:** Utilizes Machine Learning (Isolation Forest) to automatically flag high-risk constituencies and anomalous spending patterns.
- **Data Source Synchronization:** Asynchronous background ETL pipeline syncing data directly from the official eSAKSHI platform.

## Technology Stack
- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion, Lucide React, Recharts
- **Backend:** Python, FastAPI, SQLAlchemy, Pandas, Scikit-learn
- **Database:** SQLite (Transactional Local Warehouse)
- **AI/ML:** Scikit-learn (`IsolationForest` for anomaly detection)

## System Architecture & Project Structure
The project is built as a decoupled Full-Stack application:

```
/
├── backend/                  # FastAPI Backend API
│   ├── app/                  # Application code
│   │   ├── api/              # API Route Handlers (analytics, data, intelligence)
│   │   ├── services/         # Business logic and ML models
│   │   ├── models.py         # SQLAlchemy Database Models
│   │   ├── main.py           # FastAPI entrypoint
│   │   └── ...
│   ├── requirements.txt      # Python dependencies
│   └── mplads.db             # SQLite Database
│
├── frontend/                 # Next.js Frontend Application
│   ├── src/                  # React source code
│   │   ├── app/              # Next.js App Router (pages)
│   │   ├── components/       # Reusable UI components
│   │   └── ...
│   ├── public/               # Static assets
│   ├── tailwind.config.ts    # Tailwind configuration
│   └── package.json          # Node.js dependencies
└── README.md
```

## Local Setup Instructions

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Start the backend server: `python -m uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the frontend development server: `npm run dev`
4. Access the application at `http://localhost:3000`

## Environment Variables
Create a `.env` file in the `backend` directory with the following variables (placeholders):
```
DATABASE_URL=sqlite:///./mplads.db
ESAKSHI_API_KEY=your_api_key_here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Data Pipeline
The ETL pipeline fetches real-time data from the upstream Ministry of Statistics (eSAKSHI) systems. The sync is triggered manually via the `/api/data/refresh` endpoint and executes as a FastAPI background task to ensure it does not block the UI or API responsiveness. The data is cached into the local SQLite database.

## Project Status
**Active.** The platform currently fully supports Lok Sabha and Rajya Sabha intelligence, geospatial visualization, and basic anomaly detection.
