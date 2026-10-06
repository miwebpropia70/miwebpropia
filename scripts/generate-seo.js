/**
 * Automated SEO generation script for miwebpropia.com
 * Generates up-to-date sitemap.xml and robots.txt files
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://miwebpropia.com';
const ROOT_DIR = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];

const PAGES = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/#servicios', changefreq: 'monthly', priority: '0.9' },
  { url: '/#contacto', changefreq: 'monthly', priority: '0.9' },
  { url: '/#empatia', changefreq: 'monthly', priority: '0.7' },
  { url: '/#faq', changefreq: 'monthly', priority: '0.6' }
];

// 1. Generate sitemap.xml
function generateSitemap() {
  const xmlUrls = PAGES.map(p => `  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;

  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
  console.log(`[SEO BUILD] Generated sitemap.xml at: ${sitemapPath}`);
}

// 2. Generate robots.txt
function generateRobots() {
  const robotsContent = `# Robots.txt for ${DOMAIN}
User-agent: *
Allow: /

# Sitemap Index
Sitemap: ${DOMAIN}/sitemap.xml
`;

  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
  console.log(`[SEO BUILD] Generated robots.txt at: ${robotsPath}`);
}

// Execute
try {
  console.log(`[SEO BUILD] Starting automated SEO generation for ${DOMAIN}...`);
  generateSitemap();
  generateRobots();
  console.log(`[SEO BUILD] Successfully finished SEO build.`);
} catch (err) {
  console.error(`[SEO BUILD ERROR]:`, err);
  process.exit(1);
}
