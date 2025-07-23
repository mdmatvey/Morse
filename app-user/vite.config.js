import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        root: path.resolve(__dirname, 'src'),
        server: {
            port: 5173,
            open: true,
        },
        build: {
            outDir: '../../build/user-static',
            emptyOutDir: true,
        },
        define: {
            __WS_SERVER__: JSON.stringify(env.WS_SERVER),
        },
    };
});
