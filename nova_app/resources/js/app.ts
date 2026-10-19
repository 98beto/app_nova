import { createInertiaApp } from '@inertiajs/react';
import { createElement } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob('./pages/**/*.tsx');

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        return page().then(
            (module) => (module as { default: ComponentType }).default,
        );
    },
    setup({ el, App, props }) {
        createRoot(el).render(createElement(App, props));
    },
    progress: false,
});
