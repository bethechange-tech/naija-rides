#!/usr/bin/env bash

request_otp() {
  local base_url="$1"
  local phone="$2"
  local label="$3"

  log "Request OTP for ${label} (${phone})"
  local status
  status="$({ curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "$base_url/auth/otp/request" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\"}"; } )"
  require_status "$status" "204" "OTP request (${label})"
  printf 'OK: /auth/otp/request %s -> %s\n' "$label" "$status"
}

verify_otp() {
  local base_url="$1"
  local phone="$2"
  local otp_code="$3"
  local body_file="$4"
  local headers_file="$5"
  local cookie_jar="$6"
  local label="$7"

  log "Verify OTP for ${label}"
  local status
  status="$({ curl -sS -o "$body_file" -D "$headers_file" -c "$cookie_jar" -w '%{http_code}' \
    -X POST "$base_url/auth/otp/verify" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"code\":\"$otp_code\"}"; } )"
  require_status "$status" "200" "OTP verify (${label})"

  local body
  body="$(cat "$body_file")"
  LAST_TOKEN="$(printf '%s' "$body" | json_get token)" || fail "Missing ${label} token"
  if LAST_REFRESH_TOKEN="$(printf '%s' "$body" | json_get refreshToken 2>/dev/null)"; then
    :
  else
    LAST_REFRESH_TOKEN=""
  fi

  printf 'OK: /auth/otp/verify %s -> %s\n' "$label" "$status"
}

assert_auth_cookies_present() {
  local headers_file="$1"

  if ! grep -qi '^set-cookie: nr_access_token=' "$headers_file"; then
    fail "Missing nr_access_token Set-Cookie header"
  fi
  if ! grep -qi '^set-cookie: nr_refresh_token=' "$headers_file"; then
    fail "Missing nr_refresh_token Set-Cookie header"
  fi
  printf 'OK: auth cookies set on verify\n'
}

get_me_with_bearer() {
  local base_url="$1"
  local access_token="$2"
  local output_file="$3"

  log "GET /me with bearer token"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X GET "$base_url/me" \
    -H "Authorization: Bearer $access_token"; } )"
  require_status "$status" "200" "GET /me (bearer)"
  printf 'OK: /me bearer -> %s\n' "$status"
}

get_me_phone_with_bearer() {
  local base_url="$1"
  local access_token="$2"
  local output_file="$3"
  local label="$4"

  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X GET "$base_url/me" \
    -H "Authorization: Bearer $access_token"; } )"
  require_status "$status" "200" "GET /me (${label})"

  LAST_ME_PHONE="$(cat "$output_file" | json_get phone)" || fail "Missing phone in /me response for ${label}"
}

get_me_with_cookie() {
  local base_url="$1"
  local cookie_jar="$2"
  local output_file="$3"

  log "GET /me with cookie session"
  local status
  status="$({ curl -sS -o "$output_file" -b "$cookie_jar" -w '%{http_code}' \
    -X GET "$base_url/me"; } )"
  require_status "$status" "200" "GET /me (cookie)"
  printf 'OK: /me cookie -> %s\n' "$status"
}

update_me_profile() {
  local base_url="$1"
  local access_token="$2"
  local name_value="$3"
  local company_value="$4"
  local output_file="$5"

  log "POST /me profile update with bearer token"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X POST "$base_url/me" \
    -H "Authorization: Bearer $access_token" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$name_value\",\"company\":\"$company_value\"}"; } )"

  if [[ "$status" != "200" && "$status" != "204" ]]; then
    fail "POST /me failed (expected 200 or 204, got HTTP $status)"
  fi
  printf 'OK: /me update -> %s\n' "$status"
}
