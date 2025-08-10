import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// TODO: add server proxy to read /runs JSONL
export default defineConfig({ plugins: [react()] });