#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# ── Colors ─────────────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
ORANGE='\033[38;5;208m'

# ── Banner ─────────────────────────────────────────────────────────────────────
banner() {
  clear
  echo ""
  echo -e "${ORANGE}${BOLD}"
  echo '    ██████╗ ██╗████████╗██╗      ██████╗  ██████╗ '
  echo '    ██╔══██╗██║╚══██╔══╝██║     ██╔═══██╗██╔════╝ '
  echo '    ██████╔╝██║   ██║   ██║     ██║   ██║██║  ███╗'
  echo '    ██╔═══╝ ██║   ██║   ██║     ██║   ██║██║   ██║'
  echo '    ██║     ██║   ██║   ███████╗╚██████╔╝╚██████╔╝'
  echo '    ╚═╝     ╚═╝   ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝ '
  echo -e "${RESET}"
  echo -e "${DIM}    Motorcycle maintenance — dev toolkit${RESET}"
  echo ""

  local running
  running=$(docker compose ps --quiet 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$running" -gt 0 ]]; then
    echo -e "    ${GREEN}● Stack running${RESET}${DIM}  ($running container(s))${RESET}"
  else
    echo -e "    ${RED}○ Stack stopped${RESET}"
  fi
  echo ""
}

# ── Helpers ────────────────────────────────────────────────────────────────────
section() { echo -e "    ${CYAN}${BOLD}$1${RESET}"; }
opt()     { printf "    ${BOLD}${CYAN}%3s${RESET}  %s\n" "$1" "$2"; }
run()     { echo -e "\n    ${GREEN}▶ $*${RESET}\n"; "$@"; }

# ── Menu ───────────────────────────────────────────────────────────────────────
menu() {
  banner

  section "Stack"
  opt  1  "Start                  docker compose up -d"
  opt  2  "Stop                   docker compose down"
  opt  3  "Restart client"
  opt  4  "Restart server"
  echo ""

  section "Logs"
  opt  5  "Client logs  (follow)"
  opt  6  "Server logs  (follow)"
  echo ""

  section "Tests"
  opt  7  "Server tests           vitest inside container"
  echo ""

  section "Packages"
  opt  8  "Install client deps    npm install --legacy-peer-deps"
  opt  9  "Install server deps    npm install"
  opt 10  "Rebuild client image"
  opt 11  "Rebuild server image"
  echo ""

  section "Shell"
  opt 12  "Shell → client"
  opt 13  "Shell → server"
  echo ""

  opt  q  "Quit"
  echo ""
}

# ── Main loop ──────────────────────────────────────────────────────────────────
while true; do
  menu
  read -rp "    Choice: " choice
  echo ""
  case "$choice" in
    1)  run docker compose up -d ;;
    2)  run docker compose down ;;
    3)  run docker compose restart client ;;
    4)  run docker compose restart server ;;
    5)  docker compose logs client -f ;;
    6)  docker compose logs server -f ;;
    7)  run docker compose exec server sh -c "npm test" ;;
    8)  run docker compose exec client npm install --legacy-peer-deps ;;
    9)  run docker compose exec server npm install ;;
    10) run docker compose build client && docker compose up -d client ;;
    11) run docker compose build server && docker compose up -d server ;;
    12) docker compose exec client sh ;;
    13) docker compose exec server sh ;;
    q|Q) echo -e "\n    ${YELLOW}Bye.${RESET}\n"; exit 0 ;;
    *)  echo -e "    ${YELLOW}Unknown option: $choice${RESET}" ;;
  esac
  echo ""
  read -rp "    Press Enter to return to menu…" _
done
