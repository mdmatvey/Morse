import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src'), // Указываем корень проекта
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: '../dist', // Куда складывать сборку
        emptyOutDir: true,
    },
});
