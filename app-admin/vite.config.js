import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        root: path.resolve(__dirname, 'src'),
        base: '/admin/',
        server: {
            port: 5174,
            open: true,
        },
        build: {
            outDir: '../../build/admin-static',
            emptyOutDir: true,
        },
        define: {
            __WS_SERVER__: JSON.stringify(env.WS_SERVER || 'localhost:1337'),
        },
    };
});
