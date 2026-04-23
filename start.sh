#!/bin/bash
echo "Installing root dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "Starting everything up! Database will be seeded automatically."
npm run dev
