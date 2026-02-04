import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Cloud, 
  RefreshCw, 
  Fingerprint, 
  Binary,
  ArrowDown,
  FileImage
} from 'lucide-react';
import { toast } from 'sonner';

const layers = [
  {
    icon: Cloud,
    number: 1,
    title: 'API Aggregation Layer',
    description: 'OAuth 2.0 connections to manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox, etc.)',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    icon: RefreshCw,
    number: 2,
    title: 'Data Normalization Layer',
    description: 'Converts heterogeneous metrics (kWh, miles, etc.) to unified Impact Score',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    icon: Fingerprint,
    number: 3,
    title: 'Verification Engine',
    description: 'Cryptographic proof generation, device fingerprinting, tamper-evident timestamps',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    icon: Binary,
    number: 4,
    title: 'Smart Contract Bridge',
    description: 'Mint-on-Proof token issuance, milestone NFT minting, Proof-of-Delta calculation',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
];

export function SEGIArchitectureDiagram() {
  const handleDownloadSVG = () => {
    // Create SVG content for patent drawing
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <style>
    .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; }
    .layer-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
    .layer-desc { font-family: Arial, sans-serif; font-size: 11px; }
    .label { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; }
    .item-num { font-family: Arial, sans-serif; font-size: 10px; }
  </style>
  
  <!-- Title -->
  <text x="400" y="40" text-anchor="middle" class="title">SEGI™ 4-Layer Architecture</text>
  <text x="400" y="60" text-anchor="middle" class="layer-desc">(Software-Enabled Gateway Interface)</text>
  
  <!-- Layer 1: API Aggregation -->
  <rect x="100" y="90" width="600" height="100" rx="8" fill="#E3F2FD" stroke="#1976D2" stroke-width="2"/>
  <text x="120" y="115" class="label">Layer 1</text>
  <text x="120" y="135" class="layer-title">API Aggregation Layer (Item 11)</text>
  <text x="120" y="155" class="layer-desc">OAuth 2.0 connections to manufacturer APIs</text>
  
  <!-- API boxes -->
  <rect x="140" y="160" width="80" height="25" rx="4" fill="#BBDEFB" stroke="#1976D2"/>
  <text x="180" y="177" text-anchor="middle" class="item-num">Tesla API</text>
  <rect x="240" y="160" width="80" height="25" rx="4" fill="#BBDEFB" stroke="#1976D2"/>
  <text x="280" y="177" text-anchor="middle" class="item-num">Enphase API</text>
  <rect x="340" y="160" width="80" height="25" rx="4" fill="#BBDEFB" stroke="#1976D2"/>
  <text x="380" y="177" text-anchor="middle" class="item-num">SolarEdge API</text>
  <rect x="440" y="160" width="80" height="25" rx="4" fill="#BBDEFB" stroke="#1976D2"/>
  <text x="480" y="177" text-anchor="middle" class="item-num">Wallbox API</text>
  <rect x="540" y="160" width="80" height="25" rx="4" fill="#BBDEFB" stroke="#1976D2"/>
  <text x="580" y="177" text-anchor="middle" class="item-num">Third-party</text>
  
  <!-- Arrow 1 -->
  <path d="M400 195 L400 215" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Layer 2: Data Normalization -->
  <rect x="100" y="220" width="600" height="80" rx="8" fill="#E8F5E9" stroke="#388E3C" stroke-width="2"/>
  <text x="120" y="245" class="label">Layer 2</text>
  <text x="120" y="265" class="layer-title">Data Normalization Layer (Item 5)</text>
  <text x="120" y="285" class="layer-desc">Converts kWh, miles, etc. → Unified Impact Score (0.7 kg CO₂/kWh)</text>
  
  <!-- Arrow 2 -->
  <path d="M400 305 L400 325" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Layer 3: Verification Engine -->
  <rect x="100" y="330" width="600" height="80" rx="8" fill="#F3E5F5" stroke="#7B1FA2" stroke-width="2"/>
  <text x="120" y="355" class="label">Layer 3</text>
  <text x="120" y="375" class="layer-title">Verification Engine (Item 13)</text>
  <text x="120" y="395" class="layer-desc">Cryptographic proofs • Device Fingerprint (keccak256) • Tamper-evident timestamps</text>
  
  <!-- Arrow 3 -->
  <path d="M400 415 L400 435" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Layer 4: Smart Contract Bridge -->
  <rect x="100" y="440" width="600" height="100" rx="8" fill="#FFF3E0" stroke="#F57C00" stroke-width="2"/>
  <text x="120" y="465" class="label">Layer 4</text>
  <text x="120" y="485" class="layer-title">Smart Contract Bridge (Items 4, 7, 14)</text>
  <text x="120" y="505" class="layer-desc">Mint-on-Proof™ Token Issuance • Proof-of-Delta™ Calculation • Milestone NFT Minting</text>
  
  <!-- Output boxes -->
  <rect x="200" y="510" width="100" height="25" rx="4" fill="#FFE0B2" stroke="#F57C00"/>
  <text x="250" y="527" text-anchor="middle" class="item-num">$ZSOLAR Tokens</text>
  <rect x="350" y="510" width="100" height="25" rx="4" fill="#FFE0B2" stroke="#F57C00"/>
  <text x="400" y="527" text-anchor="middle" class="item-num">Milestone NFTs</text>
  <rect x="500" y="510" width="100" height="25" rx="4" fill="#FFE0B2" stroke="#F57C00"/>
  <text x="550" y="527" text-anchor="middle" class="item-num">Device Watermark</text>
  
  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  
  <!-- Patent notation -->
  <text x="400" y="580" text-anchor="middle" class="item-num">FIG. 4 - SEGI Architecture (Patent Pending)</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SEGI_Architecture_Patent_Drawing.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('SEGI Architecture diagram downloaded');
  };

  const handleDownloadPNG = async () => {
    // Create canvas and render SVG to PNG
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error('Failed to create canvas');
      return;
    }

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1600, 1200);

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SEGI™ 4-Layer Architecture', 800, 80);
    ctx.font = '24px Arial';
    ctx.fillText('(Software-Enabled Gateway Interface)', 800, 120);

    // Layer drawing helper
    const drawLayer = (y: number, color: string, borderColor: string, label: string, title: string, desc: string) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(200, y, 1200, 160, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, 240, y + 50);
      ctx.font = 'bold 24px Arial';
      ctx.fillText(title, 240, y + 90);
      ctx.font = '22px Arial';
      ctx.fillText(desc, 240, y + 130);
    };

    // Draw layers
    drawLayer(180, '#E3F2FD', '#1976D2', 'Layer 1', 'API Aggregation Layer (Item 11)', 'OAuth 2.0 connections to manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox)');
    drawLayer(380, '#E8F5E9', '#388E3C', 'Layer 2', 'Data Normalization Layer (Item 5)', 'Converts heterogeneous metrics → Unified Impact Score (0.7 kg CO₂/kWh)');
    drawLayer(580, '#F3E5F5', '#7B1FA2', 'Layer 3', 'Verification Engine (Item 13)', 'Cryptographic proofs • Device Fingerprint (keccak256) • Tamper-evident timestamps');
    drawLayer(780, '#FFF3E0', '#F57C00', 'Layer 4', 'Smart Contract Bridge (Items 4, 7, 14)', 'Mint-on-Proof™ Token Issuance • Proof-of-Delta™ Calculation • Milestone NFT Minting');

    // Draw arrows
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    for (const y of [345, 545, 745]) {
      ctx.beginPath();
      ctx.moveTo(800, y);
      ctx.lineTo(800, y + 30);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(790, y + 25);
      ctx.lineTo(800, y + 35);
      ctx.lineTo(810, y + 25);
      ctx.fill();
    }

    // Output boxes at bottom
    ctx.fillStyle = '#FFE0B2';
    ctx.strokeStyle = '#F57C00';
    ctx.lineWidth = 3;
    
    const outputY = 960;
    ctx.beginPath();
    ctx.roundRect(350, outputY, 200, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(700, outputY, 200, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(1050, outputY, 200, 50, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$ZSOLAR Tokens', 450, outputY + 32);
    ctx.fillText('Milestone NFTs', 800, outputY + 32);
    ctx.fillText('Device Watermark', 1150, outputY + 32);

    // Patent notation
    ctx.font = '20px Arial';
    ctx.fillText('FIG. 4 - SEGI Architecture (Patent Pending)', 800, 1100);

    // Download
    const link = document.createElement('a');
    link.download = 'SEGI_Architecture_Patent_Drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('SEGI Architecture PNG downloaded (1600x1200)');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          SEGI 4-Layer Architecture Diagram
        </CardTitle>
        <CardDescription>
          Downloadable patent drawing showing the complete SEGI architecture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interactive Diagram */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-muted/50 to-background border border-border/60 space-y-4">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`p-4 rounded-xl ${layer.bgColor} border ${layer.borderColor}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${layer.color} flex items-center justify-center flex-shrink-0`}>
                    <layer.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Layer {layer.number}</Badge>
                      <h4 className="font-semibold">{layer.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
              </div>
              {index < layers.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadSVG} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download SVG (Vector)
          </Button>
          <Button onClick={handleDownloadPNG} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PNG (1600×1200)
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Patent Drawing Note:</strong> These diagrams are formatted for USPTO submission as FIG. 4. 
            The SVG format is preferred for scalability; PNG is provided at high resolution for direct insertion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
