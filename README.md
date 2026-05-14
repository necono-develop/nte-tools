# NTE Tools Public Site

This folder is generated for public deployment.

It contains only the Next.js application, sanitized runtime JSON, and assets
referenced by that runtime data. Extraction tools, source sync scripts, raw
game paths, private notes, and unpublished assets are intentionally excluded.

Regenerate this folder from the editing workspace with:

```powershell
cd public-site
npm run prepare:public-release
```

Existing public WebP assets are reused by default to keep image diffs stable.
Only regenerate raster assets when intentionally refreshing image output:

```powershell
node ../tools/prepare-public-release.mjs --regenerate-assets
```
