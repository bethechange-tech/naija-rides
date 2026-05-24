#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/check-auth-flow/lib/common.sh"
source "$SCRIPT_DIR/check-auth-flow/lib/auth.sh"
source "$SCRIPT_DIR/check-auth-flow/lib/rides.sh"

# Smoke test for pilot auth + rides flow:
# 1) User A OTP request/verify
# 2) User A GET /me with bearer + cookie
# 3) User A POST /me update
# 4) User A creates a ride
# 5) User B/C/D OTP request/verify + join
# 6) Verify passenger count + print joined list

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
PHONE="${PHONE:-+2348000000000}"
SECOND_PHONE="${SECOND_PHONE:-+2348000000001}"
THIRD_PHONE="${THIRD_PHONE:-+2348000000002}"
FOURTH_PHONE="${FOURTH_PHONE:-+2348000000003}"
OTP_CODE="${OTP_CODE:-1234}"

init_workdir
trap cleanup_workdir EXIT

headers_file="$WORKDIR/verify_headers.txt"
cookie_jar="$WORKDIR/cookies.txt"
verify_body_file="$WORKDIR/verify_body.json"

second_headers_file="$WORKDIR/verify_headers_second.txt"
second_cookie_jar="$WORKDIR/cookies_second.txt"
second_verify_body_file="$WORKDIR/verify_body_second.json"

third_headers_file="$WORKDIR/verify_headers_third.txt"
third_cookie_jar="$WORKDIR/cookies_third.txt"
third_verify_body_file="$WORKDIR/verify_body_third.json"

fourth_headers_file="$WORKDIR/verify_headers_fourth.txt"
fourth_cookie_jar="$WORKDIR/cookies_fourth.txt"
fourth_verify_body_file="$WORKDIR/verify_body_fourth.json"

request_otp "$API_BASE_URL" "$PHONE" "user A"
verify_otp "$API_BASE_URL" "$PHONE" "$OTP_CODE" "$verify_body_file" "$headers_file" "$cookie_jar" "user A"
access_token="$LAST_TOKEN"
refresh_token="$LAST_REFRESH_TOKEN"
printf 'OK: tokens returned (access + refresh)\n'
assert_auth_cookies_present "$headers_file"

get_me_with_bearer "$API_BASE_URL" "$access_token" "$WORKDIR/me_bearer.json"
get_me_with_cookie "$API_BASE_URL" "$cookie_jar" "$WORKDIR/me_cookie.json"
update_me_profile "$API_BASE_URL" "$access_token" "Pilot User" "NR Lagos" "$WORKDIR/me_update.json"

create_ride "$API_BASE_URL" "$access_token" "$WORKDIR/ride_create.json"
ride_id="$LAST_RIDE_ID"

request_otp "$API_BASE_URL" "$SECOND_PHONE" "user B"
verify_otp "$API_BASE_URL" "$SECOND_PHONE" "$OTP_CODE" "$second_verify_body_file" "$second_headers_file" "$second_cookie_jar" "user B"
second_access_token="$LAST_TOKEN"
join_ride "$API_BASE_URL" "$second_access_token" "$ride_id" "$WORKDIR/ride_join.json" "user B"

request_otp "$API_BASE_URL" "$THIRD_PHONE" "user C"
verify_otp "$API_BASE_URL" "$THIRD_PHONE" "$OTP_CODE" "$third_verify_body_file" "$third_headers_file" "$third_cookie_jar" "user C"
third_access_token="$LAST_TOKEN"
join_ride "$API_BASE_URL" "$third_access_token" "$ride_id" "$WORKDIR/ride_join_third.json" "user C"

request_otp "$API_BASE_URL" "$FOURTH_PHONE" "user D"
verify_otp "$API_BASE_URL" "$FOURTH_PHONE" "$OTP_CODE" "$fourth_verify_body_file" "$fourth_headers_file" "$fourth_cookie_jar" "user D"
fourth_access_token="$LAST_TOKEN"
join_ride "$API_BASE_URL" "$fourth_access_token" "$ride_id" "$WORKDIR/ride_join_fourth.json" "user D"

verify_driver_passenger_count "$API_BASE_URL" "$access_token" "$ride_id" "3" "$WORKDIR/driver_rides.json"
passengers_count="$LAST_PASSENGERS_COUNT"
get_ride_passenger_phones "$API_BASE_URL" "$access_token" "$ride_id" "3" "$WORKDIR/ride_passengers.json"
joined_users_csv="$LAST_JOINED_USERS_CSV"

log "Auth + rides smoke test passed"
printf 'API_BASE_URL=%s\n' "$API_BASE_URL"
printf 'USER_A_PHONE=%s\n' "$PHONE"
printf 'USER_B_PHONE=%s\n' "$SECOND_PHONE"
printf 'USER_C_PHONE=%s\n' "$THIRD_PHONE"
printf 'USER_D_PHONE=%s\n' "$FOURTH_PHONE"
printf 'RIDE_ID=%s\n' "$ride_id"
printf 'JOINED_USERS=[%s]\n' "$joined_users_csv"
printf 'RIDE_PASSENGERS_COUNT=%s\n' "$passengers_count"
printf 'refresh token length=%s\n' "${#refresh_token}"
