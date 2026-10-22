#!/bin/bash
set -e
node node_modules/.bin/tsc -p tsconfig.server.json
node node_modules/.bin/vite build --config vite.config.ts
