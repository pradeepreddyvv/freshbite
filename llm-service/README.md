# FreshBite LLM Service

## Run locally

1. Create venv and install deps:
   - `python -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r requirements.txt`

2. Start server:
   - `uvicorn main:app --reload --port 8000`

## Endpoint
- POST `/chat`
