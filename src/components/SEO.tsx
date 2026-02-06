import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = 'https://zensolar.lovable.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Earn $ZSOLAR tokens and NFTs for every kWh your solar panels produce, every EV mile you drive, and every battery cycle. Patent-pending Mint-on-Proof™ technology on Base L2.';

export function SEO({
  title = 'ZenSolar — Earn $ZSOLAR For Your Clean Energy Use',
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  jsonLd,
}: SEOProps) {
  const fullTitle = title.includes('ZenSolar') ? title : `${title} | ZenSolar`;

  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ZenSolar',
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="640" />
      <meta property="og:site_name" content="ZenSolar" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ZenSolar" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
}
