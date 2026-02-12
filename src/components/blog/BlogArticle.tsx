import { SEO } from '@/components/SEO';
import { HomeNav } from '@/components/home/HomeNav';
import { HomeFooter } from '@/components/home/HomeFooter';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BlogArticleProps {
  title: string;
  description: string;
  slug: string;
  date: string;
  readTime: string;
  category: string;
  children: ReactNode;
}

export function BlogArticle({
  title,
  description,
  slug,
  date,
  readTime,
  category,
  children,
}: BlogArticleProps) {
  const url = `https://zensolar.com/blog/${slug}`;

  return (
    <>
      <SEO
        title={title}
        description={description}
        url={url}
        image="https://zensolar.com/og-image.png"
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          url,
          datePublished: date,
          dateModified: date,
          author: { '@type': 'Organization', name: 'ZenSolar', url: 'https://zensolar.com' },
          publisher: {
            '@type': 'Organization',
            name: 'ZenSolar',
            url: 'https://zensolar.com',
            logo: { '@type': 'ImageObject', url: 'https://zensolar.com/logos/zen-logo-horizontal-new.png' },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          image: 'https://zensolar.com/og-image.png',
        }}
      />
      <div className="min-h-screen bg-background">
        <HomeNav />
        <main className="container max-w-3xl mx-auto px-4 py-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
            </Link>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <Badge variant="secondary" className="text-xs">{category}</Badge>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">{title}</h1>

            <article className="prose prose-invert prose-green max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
              {children}
            </article>

            <div className="mt-12 pt-8 border-t border-border/40 text-center">
              <p className="text-muted-foreground mb-4">Ready to start earning from your clean energy?</p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
