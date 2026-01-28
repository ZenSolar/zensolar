import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const BASE_URL = 'https://zensolar.lovable.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function SEO({
  title = 'ZenSolar - Earn $ZSOLAR For Your Clean Energy',
  description = 'Earn $ZSOLAR tokens and NFTs for sustainable energy actions. Track solar, EV, and battery metrics.',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
}: SEOProps) {
  const fullTitle = title.includes('ZenSolar') ? title : `${title} | ZenSolar`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="640" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ZenSolar" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
