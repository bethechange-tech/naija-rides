#!/usr/bin/env bash

create_ride() {
  local base_url="$1"
  local access_token="$2"
  local output_file="$3"

  log "POST /rides create ride with user A"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X POST "$base_url/rides" \
    -H "Authorization: Bearer $access_token" \
    -H 'Content-Type: application/json' \
    -d '{"from":"Yaba","to":"Victoria Island","time":"9:30 AM","seats":3,"price":2500,"repeatDays":["Mon","Tue","Wed"]}'; } )"
  require_status "$status" "201" "POST /rides create"
  LAST_RIDE_ID="$(cat "$output_file" | json_get id)" || fail "Missing ride id in create response"
  printf 'OK: ride created -> id=%s\n' "$LAST_RIDE_ID"
}

join_ride() {
  local base_url="$1"
  local access_token="$2"
  local ride_id="$3"
  local output_file="$4"
  local label="$5"

  log "POST /rides/{rideId}/join as ${label}"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X POST "$base_url/rides/$ride_id/join" \
    -H "Authorization: Bearer $access_token" \
    -H 'Content-Type: application/json' \
    -d '{}'; } )"

  if [[ "$status" != "200" && "$status" != "204" ]]; then
    printf 'Join response body (%s):\n%s\n' "$label" "$(cat "$output_file")" >&2
    fail "POST /rides/{rideId}/join failed for ${label} (expected 200 or 204, got HTTP $status)"
  fi

  printf 'OK: %s joined ride %s -> %s\n' "$label" "$ride_id" "$status"
}

verify_driver_passenger_count() {
  local base_url="$1"
  local access_token="$2"
  local ride_id="$3"
  local expected_count="$4"
  local output_file="$5"

  log "GET /me/rides/driver for user A and verify passenger count"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X GET "$base_url/me/rides/driver" \
    -H "Authorization: Bearer $access_token"; } )"
  require_status "$status" "200" "GET /me/rides/driver"

  local passengers_count
  passengers_count="$(cat "$output_file" | json_array_item_field "$ride_id" passengersCount)" || fail "Could not find passengersCount for created ride in driver rides list"
  if [[ "$passengers_count" != "$expected_count" ]]; then
    printf 'Driver rides response:\n%s\n' "$(cat "$output_file")" >&2
    fail "Expected passengersCount=$expected_count for ride $ride_id, got $passengers_count"
  fi

  LAST_PASSENGERS_COUNT="$passengers_count"
  printf 'OK: passengersCount for ride %s -> %s\n' "$ride_id" "$passengers_count"
}

get_ride_passenger_phones() {
  local base_url="$1"
  local access_token="$2"
  local ride_id="$3"
  local expected_count="$4"
  local output_file="$5"

  log "GET /rides/{rideId}/passengers and extract joined users"
  local status
  status="$({ curl -sS -o "$output_file" -w '%{http_code}' \
    -X GET "$base_url/rides/$ride_id/passengers" \
    -H "Authorization: Bearer $access_token"; } )"
  require_status "$status" "200" "GET /rides/{rideId}/passengers"

  local parsed
  parsed="$(node -e 'const fs=require("fs"); const input=fs.readFileSync(0,"utf8"); const arr=JSON.parse(input); if(!Array.isArray(arr)){process.exit(2)} const phones=arr.map((x)=>x?.phone).filter((x)=>typeof x==="string"&&x.length>0); process.stdout.write(`${phones.length}|${phones.join(",")}`);' < "$output_file")" || fail "Could not parse ride passengers response"

  local found_count
  local joined_users_csv
  found_count="${parsed%%|*}"
  joined_users_csv="${parsed#*|}"

  if [[ "$found_count" != "$expected_count" ]]; then
    printf 'Ride passengers response:\n%s\n' "$(cat "$output_file")" >&2
    fail "Expected $expected_count joined users in ride passengers response, got $found_count"
  fi

  LAST_JOINED_USERS_CSV="$joined_users_csv"
  printf 'OK: joined users from ride passengers -> [%s]\n' "$joined_users_csv"
}
