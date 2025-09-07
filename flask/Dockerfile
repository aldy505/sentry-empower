FROM python:3.11-slim-bookworm

WORKDIR /src
COPY pyproject.toml uv.lock .python-version ./

COPY --from=ghcr.io/astral-sh/uv:bookworm-slim /uv /uvx /bin/
RUN uv sync --no-dev

COPY . .

ENV FLASK_APP=src.main:app
CMD ["uv", "run", "flask", "run", "--host", "0.0.0.0", "--port", "8080"]
