# KM24 Agent Backend

FastAPI backend der integrerer med Anthropic MCP SDK for at kalde km24-monitoring tools.

## Setup

1. Opret virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # På Windows: venv\Scripts\activate
```

2. Installer dependencies:
```bash
pip install -r requirements.txt
```

3. Opret `.env` fil baseret på `.env.example`:
```bash
cp .env.example .env
# Rediger .env og tilføj din ANTHROPIC_API_KEY
```

4. Start serveren:
```bash
python main.py
```

Backend kører nu på `http://localhost:8000`

## API Endpoints

- `POST /api/monitoring/generate-recipe` - Generer monitoring strategier baseret på et mål
- `POST /api/monitoring/validate-filters` - Valider filtre og få sample hits
- `POST /api/monitoring/search-hits` - Søg efter hits med givne filtre
- `GET /health` - Health check endpoint

## MCP Integration

Backend bruger Anthropic MCP SDK til at kalde km24-monitoring tools.
Se dokumentation: https://modelcontextprotocol.io/
