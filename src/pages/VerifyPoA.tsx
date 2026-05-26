/**
 * Public Receipt — `/verify/:poa`
 *
 * Thin SEO-aware page shell around <VerifyPoAContent />. The same content
 * is also rendered inside <VerifyPoASheet /> when the receipt is opened
 * from the dashboard mint-receipts drawer.
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { VerifyPoAContent } from '@/components/proof/VerifyPoAContent';

export default function VerifyPoA() {
  const { poa } = useParams<{ poa: string }>();
  const short = poa?.slice(0, 7) ?? '';

  return (
    <>
      <SEO
        title={`Verify ${short} — ZenSolar Receipt`}
        description="Public, tamper-evident verification of a ZenSolar mint. SHA-256 hash-chained per user, Merkle-anchored on Base."
        url={`https://beta.zen.solar/verify/${poa}`}
      />

      <div className="min-h-[100svh] bg-background pb-16">
        <div className="container max-w-3xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> ZenSolar
          </Link>

          <VerifyPoAContent poa={poa} />
        </div>
      </div>
    </>
  );
}

