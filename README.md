# KM24 Agent - Wizard for Monitoring Strategier

En 4-step wizard app der hjælper danske journalister med at opsætte overvågningsstrategier i KM24-platformen.

## Projekt Struktur

```
km24_agent/
├── backend/          # FastAPI backend med MCP integration
├── frontend/         # React + Vite + TypeScript frontend
└── README.md         # Dette dokument
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # På Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Rediger .env og tilføj din ANTHROPIC_API_KEY
python main.py
```

Backend kører nu på `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend kører nu på `http://localhost:5173`

### 3. Åbn Browseren

Gå til `http://localhost:5173` og brug wizard'en!

## Features

- **Step 1: Mål** - Beskriv hvad du vil overvåge
- **Step 2: Strategi** - Vælg mellem 3 AI-genererede strategier
- **Step 3: Builder** - Finjuster filtre med live preview og validation
- **Step 4: Guide** - Få implementeringsguide med curl-kommandoer

## Teknologi Stack

**Backend:**
- FastAPI
- Anthropic MCP SDK
- Python 3.9+

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Lucide React (icons)

## Documentation

Se individuelle README filer i `backend/` og `frontend/` for mere detaljeret information.

## MCP Integration

Dette projekt bruger Anthropic Model Context Protocol (MCP) til at kommunikere med km24-monitoring tools.

Se mere: https://modelcontextprotocol.io/
