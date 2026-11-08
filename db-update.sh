#!/bin/bash
echo "Generating Drizzle migration..."
npx drizzle-kit generate
echo "Migrating database..."
npx drizzle-kit migrate
echo "Done!"