import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, PenTool, Type, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface GeoInfo {
  city?: string;
  region?: string;
  country?: string;
  ip?: string;
}

interface NdaSignatureStepProps {
  accessCodeUsed: string;
  onSigned: (email?: string) => void;
}

const NDA_VERSION = '1.0';

const NDA_TEXT = `CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into as of the date of electronic signature below, between ZenSolar, LLC, a Texas limited liability company ("ZenSolar"), and the undersigned recipient ("Recipient").

1. Purpose. ZenSolar is granting Recipient access to a confidential demonstration of its clean energy technology platform, including patent-pending systems and methods (collectively, the "Demo"), solely for evaluation purposes (the "Purpose").

2. Confidential Information. "Confidential Information" means all non-public information disclosed through or relating to the Demo, including but not limited to: software interfaces, system architecture, tokenization mechanisms, patent-pending technology (U.S. Patent Application No. 19/634,402), blockchain integrations, business strategies, and any materials marked or reasonably understood to be confidential. Confidential Information does not include information that: (a) becomes publicly available through no fault of Recipient; (b) was already known to Recipient prior to disclosure; or (c) is independently developed by Recipient without use of Confidential Information.

3. Obligations. Recipient shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to any third party without ZenSolar's prior written consent; and (c) protect Confidential Information with at least the same degree of care used for its own confidential information, but no less than reasonable care.

4. No Reverse Engineering. Recipient shall not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, data structures, or underlying ideas of any software, technology, or systems demonstrated in or accessible through the Demo. Recipient shall not attempt to replicate, recreate, or build competing products or services based on the Confidential Information or the Demo.

5. Intellectual Property. No disclosure hereunder grants Recipient any license, right, or interest in ZenSolar's intellectual property, including its patent-pending technology, trademarks (Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™), or trade secrets.

6. Term & Governing Law. This Agreement remains in effect for five (5) years from the date of signature. This Agreement is governed by the laws of the State of Texas, with exclusive jurisdiction in Travis County, Texas.

7. Remedies. Recipient acknowledges that breach of this Agreement may cause irreparable harm, and ZenSolar shall be entitled to equitable relief in addition to any other remedies available at law.`;

type SignatureMethod = 'type' | 'draw';

export function NdaSignatureStep({ accessCodeUsed, onSigned }: NdaSignatureStepProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('type');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const geoRef = useRef<GeoInfo>({});

  // Fetch IP geolocation on mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        geoRef.current = {
          city: data.city,
          region: data.region,
          country: data.country_code,
          ip: data.ip,
        };
      })
      .catch(() => {
        // Geolocation is best-effort
      });
  }, []);

  // Canvas refs for draw signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hasDrawnRef = useRef(false);

  const isValid = fullName.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    && agreed
    && scrolledToBottom
    && (signatureMethod === 'type' ? signatureText.trim().length >= 2 : hasDrawnRef.current);

  // Initialize canvas
  useEffect(() => {
    if (signatureMethod !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'hsl(142, 76%, 36%)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [signatureMethod]);

  const getCanvasPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const handleDrawStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  }, [getCanvasPos]);

  const handleDrawMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    hasDrawnRef.current = true;
  }, [getCanvasPos]);

  const handleDrawEnd = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom && !scrolledToBottom) setScrolledToBottom(true);
  }, [scrolledToBottom]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      let sigText = signatureText.trim();
      if (signatureMethod === 'draw' && canvasRef.current) {
        sigText = canvasRef.current.toDataURL('image/png');
      }

      // Insert NDA signature
      const ndaId = crypto.randomUUID();
      const { error } = await supabase.from('nda_signatures').insert({
        id: ndaId,
        full_name: fullName.trim(),
        email: email.trim(),
        signature_text: sigText,
        signature_method: signatureMethod,
        nda_version: NDA_VERSION,
        access_code_used: accessCodeUsed,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      // Log demo access with geolocation (non-blocking)
      const geo = geoRef.current;
      supabase.from('demo_access_log').insert({
        access_code: accessCodeUsed,
        city: geo.city || null,
        region: geo.region || null,
        country: geo.country || null,
        ip_address: geo.ip || null,
        user_agent: navigator.userAgent,
        nda_signed: true,
        nda_signature_id: ndaId,
      }).then(({ error: logErr }) => {
        if (logErr) console.warn('Access log insert failed:', logErr);
      });

      // Try to send email copy (non-blocking)
      supabase.functions.invoke('send-nda-copy', {
        body: {
          recipientEmail: email.trim(),
          recipientName: fullName.trim(),
          signedAt: new Date().toISOString(),
          ndaVersion: NDA_VERSION,
        },
      }).catch(() => {
        console.warn('NDA email send failed — non-blocking');
      });

      // Store signer name for demo dashboard greeting
      try { sessionStorage.setItem('demo_signer_name', fullName.trim()); } catch {}

      toast.success('Agreement signed', { description: 'A copy has been sent to your email.' });
      onSigned(email.trim());
    } catch (err) {
      console.error('NDA sign error:', err);
      toast.error('Failed to record signature', { description: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center px-5 pt-5 pb-3 shrink-0">
        <img src={zenLogo} alt="ZenSolar" className="h-8 mb-2" />
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" />
          Confidentiality Agreement
        </h2>
      </div>
      <p className="text-xs text-muted-foreground px-5 pb-3">
        Please review and sign before accessing the demo.
      </p>

      {/* NDA Text - scrollable */}
      <div className="flex-1 min-h-0 px-5 pb-2">
        <div
          className="h-full overflow-y-auto rounded-lg border border-border bg-card/50 p-4"
          onScroll={handleScroll}
        >
          <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80 font-sans">
            {NDA_TEXT}
          </pre>
          {!scrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
          )}
        </div>
        {!scrolledToBottom && (
          <p className="text-[10px] text-muted-foreground text-center mt-1 animate-pulse">
            ↓ Scroll to bottom to continue
          </p>
        )}
      </div>

      {/* Signature form — only interactive after scrolling to bottom */}
      <div className={cn(
        "shrink-0 px-5 pb-5 pt-2 space-y-3 transition-opacity duration-300",
        scrolledToBottom ? 'opacity-100' : 'opacity-40 pointer-events-none'
      )}>
        {/* Name & Email */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full name"
            className="text-sm h-10"
            autoComplete="name"
          />
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="text-sm h-10"
            autoComplete="email"
          />
        </div>

        {/* Signature method toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSignatureMethod('type')}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              signatureMethod === 'type'
                ? 'bg-secondary/15 border-secondary/40 text-secondary'
                : 'bg-transparent border-border text-muted-foreground hover:border-secondary/30'
            )}
          >
            <Type className="h-3 w-3" /> Type
          </button>
          <button
            onClick={() => setSignatureMethod('draw')}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              signatureMethod === 'draw'
                ? 'bg-secondary/15 border-secondary/40 text-secondary'
                : 'bg-transparent border-border text-muted-foreground hover:border-secondary/30'
            )}
          >
            <PenTool className="h-3 w-3" /> Draw
          </button>
        </div>

        {/* Signature input */}
        {signatureMethod === 'type' ? (
          <Input
            value={signatureText}
            onChange={e => setSignatureText(e.target.value)}
            placeholder="Type your full name as signature"
            className="text-sm h-10 font-serif italic"
            style={{ fontFamily: "'Noto Serif', 'Georgia', serif" }}
          />
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-20 rounded-lg border border-border bg-card/50 cursor-crosshair touch-none"
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
            />
            <button
              onClick={clearCanvas}
              className="absolute top-1 right-1 text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-background/80"
            >
              Clear
            </button>
          </div>
        )}

        {/* Agreement checkbox */}
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={agreed}
            onCheckedChange={v => setAgreed(v === true)}
            className="mt-0.5"
          />
          <span className="text-[11px] text-foreground/70 leading-tight">
            I have read and agree to this Confidentiality Agreement. I understand this demo contains patent-pending technology.
          </span>
        </label>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full h-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing…</>
          ) : (
            'Sign & Enter Demo'
          )}
        </Button>

        <p className="text-[9px] text-muted-foreground/60 text-center">
          A signed copy will be emailed to you from joe@zen.solar
        </p>
      </div>
    </div>
  );
}
