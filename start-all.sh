#!/bin/bash
# Start all FreshBite services locally
# Requires: .env file with DATABASE_URL, SPRING_DATASOURCE_* variables
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo "Loading .env..."
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Kill old processes
echo "=== Killing old processes ==="
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Spring Boot
echo "=== Starting Spring Boot on port 8080 ==="
java -jar "$SCRIPT_DIR/backend-spring/target/backend-0.1.0.jar" &
SPRING_PID=$!

# Start FastAPI
echo "=== Starting FastAPI on port 8000 ==="
cd "$SCRIPT_DIR/llm-service"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!
cd "$SCRIPT_DIR"

# Wait for backends
echo "Waiting for backends..."
sleep 4

# Start Next.js
echo "=== Starting Next.js on port 3000 ==="
npx next dev &
NEXT_PID=$!

echo ""
echo "=== All services started ==="
echo "  Next.js:     http://localhost:3000  (PID: $NEXT_PID)"
echo "  Spring Boot: http://localhost:8080  (PID: $SPRING_PID)"
echo "  FastAPI:     http://localhost:8000  (PID: $FASTAPI_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

trap "echo 'Stopping...'; kill $SPRING_PID $FASTAPI_PID $NEXT_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
