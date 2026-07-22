// content.js — Injected into fanbox.cc pages to find image URLs

/**
 * Fanbox URL patterns:
 *
 *  Full/Original  → https://downloads.fanbox.cc/images/post/{postId}/{filename}
 *  Thumbnail path → https://downloads.fanbox.cc/images/post/{postId}/thumbnails/w{size}/{filename}
 *  With query     → https://downloads.fanbox.cc/images/post/{postId}/{filename}?w=1200
 *
 * Strategy:
 *  1. Collect ALL matching URLs
 *  2. Strip query params from all of them
 *  3. Classify: if path contains "/thumbnails/" → preview, else → full
 *  4. Group by filename — one entry per unique filename
 *  5. For each filename, store both the full URL and thumbnail URL (if found)
 *  6. Return { full: [...], preview: [...], postId }
 */

function findFanboxImages() {
  const rawUrls = new Set();
  const regex   = /https:\/\/downloads\.fanbox\.cc\/images\/post\/[^"'\s<>\\]+/g;

  // ── Collect from raw HTML (catches everything: img, srcset, style, JSON, etc.)
  const pageHtml = document.documentElement.innerHTML;
  let m;
  while ((m = regex.exec(pageHtml)) !== null) {
    rawUrls.add(stripQuery(m[0]));
  }

  // ── Also walk <a href> tags (direct file links)
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.href || '';
    if (/downloads\.fanbox\.cc\/images\/post\//.test(href)) {
      rawUrls.add(stripQuery(href));
    }
  });

  // ── Classify each URL
  //    thumbnail path contains "/thumbnails/" in the pathname
  const fullMap    = new Map(); // filename → full URL
  const thumbMap   = new Map(); // filename → thumbnail URL

  for (const url of rawUrls) {
    const filename = extractFilename(url);
    if (!filename) continue;

    const isThumbnail = url.includes('/thumbnails/');

    if (isThumbnail) {
      // Always prefer the one with larger size if multiple thumb sizes exist
      if (!thumbMap.has(filename)) {
        thumbMap.set(filename, url);
      } else {
        // Keep the larger width version
        const existing  = thumbMap.get(filename);
        const existSize = parseThumbnailSize(existing);
        const newSize   = parseThumbnailSize(url);
        if (newSize > existSize) thumbMap.set(filename, url);
      }
    } else {
      // Full resolution — the path ends at the filename with no size segment
      fullMap.set(filename, url);
    }
  }

  // ── Build final lists keyed by filename
  //    For "full", use the direct URL; if no direct URL, use the largest thumbnail.
  //    For "preview", use the thumbnail URL; if no thumbnail, use the direct URL.
  const allFilenames = new Set([...fullMap.keys(), ...thumbMap.keys()]);

  const fullUrls    = [];
  const previewUrls = [];

  for (const filename of allFilenames) {
    fullUrls.push(fullMap.get(filename) ?? thumbMap.get(filename));
    previewUrls.push(thumbMap.get(filename) ?? fullMap.get(filename));
  }

  return { full: fullUrls, preview: previewUrls };
}

// ── Strip query string from URL
function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

// ── Extract the filename (last path segment) from a URL
function extractFilename(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

// ── Parse thumbnail width from path like .../thumbnails/w1200/filename.jpeg
function parseThumbnailSize(url) {
  const match = url.match(/\/thumbnails\/w(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Extract post ID from current URL
function getPostId() {
  const match = window.location.href.match(/\/posts\/(\d+)/);
  return match ? match[1] : 'unknown';
}

// ── Return results
const { full, preview } = findFanboxImages();
const postId = getPostId();
({ full, preview, postId });
