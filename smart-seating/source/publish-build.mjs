import { cpSync, copyFileSync } from 'node:fs';
copyFileSync(new URL('./dist/index.html', import.meta.url), new URL('../index.html', import.meta.url));
cpSync(new URL('./dist/assets', import.meta.url), new URL('../assets', import.meta.url), { recursive: true });
