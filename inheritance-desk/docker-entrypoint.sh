#!/bin/sh
set -e

# Some hosts store connection strings WITH surrounding quotes when a value is
# pasted from a .env file: DATABASE_URL="postgresql://...". A .env file strips
# those on load, but a raw host env var keeps them, and the Postgres driver then
# rejects the leading quote. Strip one pair of surrounding quotes before use.
strip_quotes() {
  value="$1"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
  esac
  printf '%s' "$value"
}

if [ -n "$DATABASE_URL" ]; then DATABASE_URL="$(strip_quotes "$DATABASE_URL")"; export DATABASE_URL; fi

# Schema is applied at deploy time from the developer machine (make deploy runs
# `make db-schema` before `railway up`), so the container just serves.
exec node server.js
