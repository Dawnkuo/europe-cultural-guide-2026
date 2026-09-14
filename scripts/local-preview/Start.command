#!/bin/zsh -l
cd -- "${0:A:h}"
NODE="$(command -v node)"
if [[ -z "$NODE" && -x /opt/homebrew/bin/node ]]; then NODE=/opt/homebrew/bin/node; fi
if [[ -z "$NODE" && -x /usr/local/bin/node ]]; then NODE=/usr/local/bin/node; fi
if [[ -z "$NODE" ]]; then
  printf 'Node.js is required to open this local preview. No npm install or build is needed.\n'
  read -r '?Press Return to close.'
  exit 1
fi
"$NODE" ./serve.mjs --open
