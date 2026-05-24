#!/usr/bin/env bash

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_status() {
  local got="$1"
  local want="$2"
  local step="$3"
  if [[ "$got" != "$want" ]]; then
    fail "$step failed (expected HTTP $want, got HTTP $got)"
  fi
}

json_get() {
  local key="$1"
  node -e 'const fs=require("fs"); const input=fs.readFileSync(0,"utf8"); const obj=JSON.parse(input); const v=obj[process.argv[1]]; if(v===undefined||v===null){process.exit(2)} process.stdout.write(String(v));' "$key"
}

json_array_item_field() {
  local id="$1"
  local field="$2"
  node -e 'const fs=require("fs"); const input=fs.readFileSync(0,"utf8"); const arr=JSON.parse(input); if(!Array.isArray(arr)){process.exit(2)} const item=arr.find((x)=>x && x.id===process.argv[1]); if(!item || item[process.argv[2]]===undefined || item[process.argv[2]]===null){process.exit(3)} process.stdout.write(String(item[process.argv[2]]));' "$id" "$field"
}

init_workdir() {
  WORKDIR="$(mktemp -d)"
}

cleanup_workdir() {
  if [[ -n "${WORKDIR:-}" && -d "${WORKDIR:-}" ]]; then
    rm -rf "$WORKDIR"
  fi
}
