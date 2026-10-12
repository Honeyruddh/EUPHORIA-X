# Open-Source Libraries & APIs Used in CampusPulse

In compliance with project specifications, all external dependencies, libraries, and frameworks are disclosed below.

## Backend (Python)
- **FastAPI** (`v0.110.0+`): High-performance asynchronous REST API framework (License: MIT).
- **Uvicorn** (`v0.28.0+`): Lightning-fast ASGI web server implementation (License: BSD-3-Clause).
- **SQLAlchemy** (`v2.0.28+`): SQL toolkit and Object Relational Mapper for database abstraction (License: MIT).
- **SQLite3** (Python built-in): Embedded ACID-compliant relational database.
- **Pydantic** (`v2.6.4+`): Data validation and settings management using Python type hints (License: MIT).
- **pandas** (`v2.2.1+`): Data manipulation and rolling time-series analysis (License: BSD-3-Clause).
- **NumPy** (`v1.26.4+`): Numerical arrays, mathematical routines, and vector operations (License: BSD-3-Clause).
- **scikit-learn** (`v1.4.1+`): Machine learning algorithms, specifically `IsolationForest` for multi-variate anomaly detection (License: BSD-3-Clause).
- **httpx** (`v0.27.0+`): HTTP client used for automated API testing and optional external integrations (License: BSD-3-Clause).
- **pytest** (`v8.1.1+`): Testing framework for verifying anomaly detection, metrics, and CO2e/INR calculations (License: MIT).

## Frontend (JavaScript / React)
- **React 18** (`react`, `react-dom`): Declarative component-based UI library (License: MIT).
- **Vite**: Next-generation frontend build tool and development server (License: MIT).
- **Tailwind CSS**: Utility-first styling framework used for modern, responsive UI design (License: MIT).
- **Recharts**: Composable charting library built with React and SVG (License: MIT).
- **Lucide React**: Clean, lightweight icon suite for modern dashboard interfaces (License: ISC).
- **Canvas-Confetti** (Optional/Demo): Lightweight micro-interaction library for celebration upon achieving goals (License: MIT).

## APIs & External Services
- **Anthropic Claude API (Optional)**: Natural language generation for weekly campus sustainability executive summaries. Activated only when `ANTHROPIC_API_KEY` is provided in `.env`. CampusPulse features a zero-dependency intelligent template engine fallback if the key is absent.
