#!/bin/sh
set -eu

yarn install --immutable
exec "$@"
