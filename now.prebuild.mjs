import { glob, rollup, servicenowFrontEndPlugins } from '@servicenow/isomorphic-rollup';

/**
 * Prebuild script for building the client assets of the application before running the rest of the build.
 * Export an async function that accepts useful modules for building the application as arguments.
 * This function returns a Promise that resolves when the build is complete.
 * You can also export an array of functions if you want to run multiple prebuild steps.
 */
// export default async ({ rootDir, config, fs, path, logger, registerExplicitId }) => {
//     // This is where all the client source files are located
//     const clientDir = path.join(rootDir, config.clientDir)
//     const htmlFilePattern = path.join('**', '*.html')
//     const htmlFiles = await glob(htmlFilePattern, { cwd: clientDir, fs })
//     if (!htmlFiles.length) {
//         logger.warn(`No HTML files found in ${clientDir}, skipping UI build.`)
//         return
//     }

//     // This is the destination for the build output
//     const staticContentDir = path.join(rootDir, config.staticContentDir)
//     // Clean up any previous build output
//     fs.rmSync(staticContentDir, { recursive: true, force: true })

//     // Call the rollup build
//     const rollupBundle = await rollup({
//         // Use the file system module provided by the build environment
//         fs,
//         // Search all HTML files in the client directory to find entry points
//         input: path.join(clientDir, '**', '*.html'),
//         // Use the default set of ServiceNow plugins for Rollup
//         // configured for the scope name and root directory
//         plugins: servicenowFrontEndPlugins({
//             scope: config.scope,
//             rootDir: clientDir,
//             registerExplicitId,
//         }),
//     })
//     // Write the build output to the configured destination
//     // including source maps for JavaScript files
//     const rollupOutput = await rollupBundle.write({
//         dir: staticContentDir,
//         sourcemap: true,
//     })
//     // Print the build results
//     rollupOutput.output.forEach((file) => {
//         if (file.type === 'asset') {
//             logger.info(`Bundled asset: ${file.fileName} (${file.source.length} bytes)`)
//         } else if (file.type === 'chunk') {
//             logger.info(`Bundled chunk: ${file.fileName} (${file.code.length} bytes)`)
//         }
//     })
// }


/**
 * Prebuild script with post-build cleanup for src/client/index.html.
 */
export default async ({ rootDir, config, fs, path, logger, registerExplicitId }) => {
    const exists = (p) => {
        try {
            fs.accessSync(p);
            return true;
        } catch {
            return false;
        }
    };

    const clientDir = path.join(rootDir, config.clientDir);
    const staticContentDir = path.join(rootDir, config.staticContentDir);
    const htmlGlob = '**/*.html';
    const stylesDir = path.join(clientDir, 'styles');

    const localOut = path.join(clientDir, 'assets', 'tailwind.browser.js');
    const browserDist = path.join(rootDir, 'node_modules', '@tailwindcss', 'browser', 'dist');
    const candidates = [
        path.join(browserDist, 'index.global.js'),
        path.join(browserDist, 'index.iife.js'),
        path.join(browserDist, 'index.min.js'),
        path.join(browserDist, 'index.js'),
    ];
    const CDN_URL = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

    const vendorBrowserBuild = () => {
        for (const src of candidates) {
            if (exists(src)) {
                fs.mkdirSync(path.dirname(localOut), { recursive: true });
                if (!exists(localOut)) fs.copyFileSync(src, localOut);
                return true;
            }
        }
        return false;
    };

    const getScriptTag = () => {
        if (vendorBrowserBuild()) {
            logger.info(`[Tailwind] Vendored @tailwindcss/browser → ${path.relative(clientDir, localOut)}`);
            return `<script src="./assets/tailwind.browser.js" data-tailwind="true"></script>`;
        } else {
            logger.warn('[Tailwind] Local @tailwindcss/browser not found; falling back to CDN.');
            return `<script src="${CDN_URL}" data-tailwind="true"></script>`;
        }
    };

    const readStylesCss = () => {
        if (!exists(stylesDir)) {
            logger.warn(`[Tailwind] Styles directory not found: ${stylesDir}. Using default Tailwind CSS block.`);
            return { css: ['@import "tailwindcss";', '@source "./**/*.html";', '@source "./**/*.{js,ts,jsx,tsx}";'].join('\n') };
        }
        try {
            const files = fs.readdirSync(stylesDir).filter(f => f.toLowerCase().endsWith('.css'));
            if (!files.length) {
                logger.warn(`[Tailwind] No .css files in ${stylesDir}. Using default Tailwind CSS block.`);
                return { css: ['@import "tailwindcss";', '@source "./**/*.html";', '@source "./**/*.{js,ts,jsx,tsx}";'].join('\n') };
            }
            const lower = files.map(f => f.toLowerCase());
            const idxTailwind = lower.indexOf('tailwind.css');
            const idxIndex = lower.indexOf('index.css');
            const chosen = idxTailwind >= 0 ? files[idxTailwind] : (idxIndex >= 0 ? files[idxIndex] : files[0]);
            const abs = path.join(stylesDir, chosen);
            const css = fs.readFileSync(abs, 'utf8');
            logger.info(`[Tailwind] Using CSS from ${path.relative(clientDir, abs)}`);
            return { css: css?.toString(), file: abs };
        } catch (e) {
            logger.warn(`[Tailwind] Failed to read styles from ${stylesDir}: ${e?.message || e}`);
            return { css: ['@import "tailwindcss";', '@source "./**/*.html";', '@source "./**/*.{js,ts,jsx,tsx}";'].join('\n') };
        }
    };

    const buildStyleBlock = (css) => ['<style type="text/tailwindcss" data-tailwind="true">', css, '</style>'].join('\n');

    const RE_TAILWIND_STYLE_BLOCK =
        /<style[^>]+type=["']text\/tailwindcss["'][^>]*data-tailwind=["']true["'][^>]*>[\s\S]*?<\/style>/i;
    const RE_TAILWIND_STYLE_CAPTURE =
        /(<style[^>]+type=["']text\/tailwindcss["'][^>]*data-tailwind=["']true["'][^>]*>)([\s\S]*?)(<\/style>)/i;
    const RE_INJECTED_SCRIPT_TAG =
        /<script[^>]*data-tailwind=["']true["'][^>]*>\s*<\/script>/i;
    const RE_BROWSER_SCRIPT_GENERIC =
        /<script[^>]+src=["'][^"']*(?:@tailwindcss\/browser|tailwind\.browser\.js)[^"']*["'][^>]*>\s*<\/script>/i;
    const RE_LEGACY_LINK_TAILWIND =
        /<link[^>]+href=["'][^"']*tailwind(?:\.build)?\.css[^"']*["'][^>]*>\s*/gi;

    const htmlFiles = await glob(htmlGlob, { cwd: clientDir, fs });
    if (!htmlFiles.length) logger.warn(`No HTML files found in ${clientDir}, skipping UI build.`);

    const scriptTag = getScriptTag();
    const { css } = readStylesCss();
    const styleBlock = buildStyleBlock(css);

    for (const rel of htmlFiles) {
        const abs = path.join(clientDir, rel);
        let html = fs.readFileSync(abs, 'utf8')?.toString();
        let mutated = false;

        const cleaned = html?.replace(RE_LEGACY_LINK_TAILWIND, '');
        if (cleaned !== html) {
            html = cleaned;
            mutated = true;
            logger.info(`[Tailwind] Removed legacy <link ...tailwind*.css> from ${rel}`);
        }

        const hasStyle = RE_TAILWIND_STYLE_BLOCK.test(html);
        const hasScript = RE_INJECTED_SCRIPT_TAG.test(html) || RE_BROWSER_SCRIPT_GENERIC.test(html);

        if (!hasScript) {
            if (hasStyle) {
                html = html?.replace(RE_TAILWIND_STYLE_BLOCK, `${scriptTag}\n$&`);
            } else if (/(<\/head>)/i.test(html)) {
                html = html?.replace(/<\/head>/i, `${scriptTag}\n</head>`);
            } else {
                html = `${scriptTag}\n${html}`;
            }
            mutated = true;
            logger.info(`[Tailwind] Inserted @tailwindcss/browser <script> into ${rel}`);
        }

        if (hasStyle) {
            const updated = html?.replace(RE_TAILWIND_STYLE_CAPTURE, (_m, open, inner, close) => {
                if (inner.trim() === css.trim()) return `${open}${inner}${close}`;
                mutated = true;
                logger.info(`[Tailwind] Updated <style type="text/tailwindcss"> content in ${rel}`);
                return `${open}\n${css}\n${close}`;
            });
            html = updated;
        } else {
            if (/(<\/head>)/i.test(html)) {
                html = html?.replace(/<\/head>/i, `${styleBlock}\n</head>`);
            } else {
                html = `${styleBlock}\n${html}`;
            }
            mutated = true;
            logger.info(`[Tailwind] Inserted <style type="text/tailwindcss"> into ${rel}`);
        }

        if (mutated) fs.writeFileSync(abs, html);
    }

    fs.rmSync(staticContentDir, { recursive: true, force: true });

    const rollupBundle = await rollup({
        fs,
        input: path.join(clientDir, "**", '*.html'),
        plugins: servicenowFrontEndPlugins({
            scope: config.scope,
            rootDir: clientDir,
            registerExplicitId,
        }),
    });

    const rollupOutput = await rollupBundle.write({ dir: staticContentDir, sourcemap: true });
    rollupOutput.output.forEach((file) => {
        if (file.type === 'asset') {
            const size = typeof file.source === 'string' ? file.source.length : (file.source?.byteLength ?? 0);
            logger.info(`Bundled asset: ${file.fileName} (${size} bytes)`);
        } else if (file.type === 'chunk') {
            logger.info(`Bundled chunk: ${file.fileName} (${file.code.length} bytes)`);
        }
    });
    // Post-build cleanup for src/client/index.html
    const indexAbs = path.join(clientDir, 'index.html');
    if (exists(indexAbs)) {
        let html = fs.readFileSync(indexAbs, 'utf8')?.toString();
        const before = html;
        html = html?.replace(RE_INJECTED_SCRIPT_TAG, '');
        html = html?.replace(RE_TAILWIND_STYLE_BLOCK, '');
        if (html !== before) {
            fs.writeFileSync(indexAbs, html);
            logger.info('[Tailwind] Cleaned injected Tailwind <script> and <style> from index.html after build.');
        } else {
            logger.info('[Tailwind] No injected Tailwind blocks found in index.html to clean.');
        }
    } else {
        logger.warn(`[Tailwind] index.html not found at ${indexAbs}; post-build cleanup skipped.`);
    }
};



