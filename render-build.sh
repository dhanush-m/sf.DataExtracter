#!/usr/bin/env bash
apt-get update && apt-get install -y libsecret-1-dev
npm install
npm run build