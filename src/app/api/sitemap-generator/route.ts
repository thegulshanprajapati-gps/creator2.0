import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:9002';
    
    // Base static paths
    const staticPaths = [
      '',
      '/about',
      '/blog',
      '/community',
      '/contact',
      '/courses',
      '/faq',
      '/login',
      '/privacy',
      '/profile',
      '/refund',
      '/terms',
      '/updates',
    ];

    const dynamicPaths: string[] = [];

    // Fetch dynamic blog posts (from static default list)
    const blogSlugs = [
      'the-future-of-web-architecture-in-2024',
      'mastering-the-Xmarty Creator-workflow',
      'why-ai-powered-learning-is-the-new-gold-standard'
    ];
    blogSlugs.forEach(slug => {
      dynamicPaths.push(`/blog/${slug}`);
    });

    const db = await getDb();
    
    // 1. Courses
    try {
      const courses = await db.collection('courses').find({}).toArray();
      courses.forEach((c: any) => {
        if (c._id) {
          dynamicPaths.push(`/courses/${c._id.toString()}`);
        }
      });
    } catch (e) {
      console.warn('Could not load courses for sitemap', e);
    }

    // 2. Course folders / categories
    try {
      const folders = await db.collection('course_folders').find({}).toArray();
      folders.forEach((f: any) => {
        if (f._id) {
          dynamicPaths.push(`/courses/${f._id.toString()}`);
        }
      });
    } catch (e) {
      console.warn('Could not load course folders for sitemap', e);
    }

    // 3. Custom DB-driven pages
    try {
      const pages = await db.collection('pages').find({}).toArray();
      pages.forEach((p: any) => {
        if (p.slug && p.slug !== 'home') {
          dynamicPaths.push(`/${p.slug}`);
        }
      });
    } catch (e) {
      console.warn('Could not load custom pages for sitemap', e);
    }

    const allPaths = [...new Set([...staticPaths, ...dynamicPaths])];
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    allPaths.forEach((p) => {
      const priority = p === '' ? 1.0 : p.startsWith('/courses') || p.startsWith('/blog') ? 0.8 : 0.5;
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${baseUrl}${p}</loc>\n`;
      xmlContent += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xmlContent += '    <changefreq>weekly</changefreq>\n';
      xmlContent += `    <priority>${priority}</priority>\n`;
      xmlContent += '  </url>\n';
    });
    
    xmlContent += '</urlset>\n';

    // Paths to write
    const mainSiteSitemapPath = path.resolve('..', 'public', 'sitemap.xml');
    const supportSiteSitemapPath = path.resolve('public', 'sitemap.xml');

    // Ensure public directories exist and write files
    try {
      await fs.mkdir(path.dirname(mainSiteSitemapPath), { recursive: true });
      await fs.writeFile(mainSiteSitemapPath, xmlContent, 'utf-8');
      console.log('Main site sitemap written to:', mainSiteSitemapPath);
    } catch (err) {
      console.warn('Could not write sitemap to main site:', err);
    }

    try {
      await fs.mkdir(path.dirname(supportSiteSitemapPath), { recursive: true });
      await fs.writeFile(supportSiteSitemapPath, xmlContent, 'utf-8');
      console.log('Support site sitemap written to:', supportSiteSitemapPath);
    } catch (err) {
      console.warn('Could not write sitemap to support site:', err);
    }

    return NextResponse.json({ success: true, message: 'Sitemaps initialized and updated successfully!' });
  } catch (error: any) {
    console.error('Failed to generate sitemap:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
