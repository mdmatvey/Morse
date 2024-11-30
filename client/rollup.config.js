import resolve from '@rollup/plugin-node-resolve'; // Для поддержки модулей
import commonjs from '@rollup/plugin-commonjs'; // Для совместимости CommonJS
import html from '@rollup/plugin-html'; // Для работы с HTML
import { terser } from 'rollup-plugin-terser'; // Для минификации JS

export default {
    input: 'renderer/js/main.js', // Входной файл JavaScript
    output: {
        file: 'dist/rollup/bundle.js', // Выходной JS
        format: 'iife', // Для запуска в браузере
    },
    plugins: [
        resolve(),
        commonjs(),
        terser(), // Минификация JS
        html({
            title: 'Morse Code App',
            template: ({ attributes, files, meta, publicPath, title }) => `
               <!DOCTYPE html>
                <html>
                    <head>
                    <title>${title}</title>
                    ${meta?.map(entry => `<meta ${entry}>`).join('\n') || ''}
                    </head>
                    <body>
                    <div id="app"></div>
                    ${files?.js?.map(file => `<script src="${publicPath}${file.fileName}"></script>`).join('\n') || ''}
                    </body>
                </html>
            `
        }),
    ],
};
