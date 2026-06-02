#!/bin/sh
# workaround for https://github.com/obsidian-community/jest-environment-obsidian/issues/3
cp jest-environment-obsidian.js node_modules/jest-environment-obsidian/dist/jest-environment.js
# Remove nested jest-environment-jsdom so the environment uses the project-level v30,
# which provides jest-mock@30 with clearMocksOnScope (required by jest-runtime@30).
rm -rf node_modules/jest-environment-obsidian/node_modules/jest-environment-jsdom
