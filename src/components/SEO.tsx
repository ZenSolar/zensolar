import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  image?: string;
  url?: string;
}

const BASE_URL = 'https://zensolar.lovable.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function SEO({
  title = 'Earn $ZSOLAR For Your Clean Energy Use',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
}: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="640" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ZenSolar" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
