import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { 
  Rocket, Building2, Users, FileText, Globe, Calendar, 
  MapPin, Briefcase, GraduationCap, Linkedin, Github, Twitter,
  Link as LinkIcon, ExternalLink, CheckCircle2
} from "lucide-react";

// ── Data ────────────────────────────────────────────────────────────────

interface A16ZQuestion {
  label: string;
  value: string;
  type?: "text" | "choice" | "badge";
}

interface A16ZSection {
  title: string;
  icon: React.ReactNode;
  questions: A16ZQuestion[];
}

const APPLICATION_DATA: A16ZSection[] = [
  {
    title: "Startup Details",
    icon: <Building2 className="h-5 w-5 text-primary" />,
    questions: [
      { label: "Startup Name", value: "ZenSolar" },
      { label: "One-liner (10 words)", value: "Rewards solar owners and EV drivers with blockchain tokens." },
      {
        label: "Startup Description (100 words)",
        value: `ZenSolar is a consumer app that pays people for their verified clean energy use. Users connect solar panels, batteries, EV chargers, or electric vehicles via manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox) and earn $ZSOLAR tokens for every verified kWh produced or EV mile driven.

Our patent-pending Proof-of-Delta engine creates cryptographic proofs binding each token to a specific energy unit. A Device Watermark Registry prevents double-minting across platforms.

The entire experience — signup, device connection, real-time monitoring, minting, NFT collection, and USD cash-out — lives in one app. No MetaMask, no seed phrases, no crypto knowledge required.

Solo founder, live on testnet with 19 beta users and real device connections. Pre-seed stage.`,
      },
      { label: "Primary Category", value: "Web3" },
      { label: "Secondary Category", value: "Consumer Applications" },
      { label: "Country", value: "United States" },
      { label: "City", value: "Austin" },
      { label: "Founded — Year", value: "2024" },
      { label: "Founded — Month", value: "September" },
      { label: "Company Website", value: "https://beta.zen.solar" },
      {
        label: "Anything else we should know?",
        value: `Provisional patent filed March 2025 — "Gamifying and Tokenizing Sustainable Behaviors By Using Blockchain Technology." Trademark applications pending for Mint-on-Proof™, Proof-of-Delta™, and Proof-of-Origin™. Currently live on Base testnet with real energy data flowing from connected devices.`,
      },
    ],
  },
  {
    title: "Team",
    icon: <Users className="h-5 w-5 text-primary" />,
    questions: [
      { label: "Full-time or Part-time?", value: "Full-time", type: "choice" },
      { label: "Number of full-time founders", value: "1" },
      { label: "Total FTE Employees", value: "1" },
      {
        label: "Team's relevant experience (100 words)",
        value: `12+ years in clean energy and solar, starting at SolarCity (pre-Tesla acquisition) where I was a top-performing sales rep, then continuing through Tesla Energy. Deep domain expertise in residential solar, battery storage, and EV ecosystems — I understand the hardware, the customer journey, and the pain points firsthand.

After Tesla, I built and sold two businesses (a solar company and a real estate venture), giving me end-to-end startup experience from zero to exit. I taught myself to code and built ZenSolar's full stack solo — React, TypeScript, Solidity smart contracts, Supabase backend, and live API integrations with Tesla, Enphase, SolarEdge, and Wallbox.`,
      },
    ],
  },
  {
    title: "Founder Details — CEO",
    icon: <Briefcase className="h-5 w-5 text-primary" />,
    questions: [
      { label: "First Name", value: "Joe" },
      { label: "Last Name", value: "Maushart" },
      { label: "Email", value: "joe@joemaushart.com" },
      { label: "Country", value: "United States" },
      { label: "City", value: "Austin" },
      { label: "Citizenship", value: "United States" },
      { label: "College / University", value: "University of Texas at Austin" },
      { label: "Highest Education", value: "Bachelor's" },
      { label: "Years of Professional Experience", value: "12+" },
      { label: "Technical enough to build end-to-end?", value: "Yes", type: "choice" },
      { label: "LinkedIn", value: "https://linkedin.com/in/joemaushart" },
      { label: "GitHub", value: "https://github.com/joemaushart" },
      { label: "X (Twitter)", value: "https://x.com/joemaushart" },
      { label: "Portfolio / Personal Site", value: "https://joemaushart.com" },
    ],
  },
  {
    title: "Additional Information",
    icon: <FileText className="h-5 w-5 text-primary" />,
    questions: [
      { label: "Pitch Deck (PDF)", value: "To be attached — investor one-pager and pitch deck available." },
      { label: "Funding History", value: "No outside funding to date. Self-funded / bootstrapped." },
      { label: "Active Fundraising Round", value: "Pre-seed. Raising $500K on a $5M post-money SAFE to fund go-to-market, first hire (technical co-founder), and mainnet launch." },
      { label: "Metrics", value: "19 active beta users on testnet. Live API connections with Tesla, Enphase, SolarEdge, Wallbox. Real energy data flowing and tokens minting from real devices." },
      { label: "Where did you learn about Speedrun?", value: "Twitter / X" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────

const getExportData = () => {
  const rows: Array<{ section: string; question: string; answer: string }> = [];
  APPLICATION_DATA.forEach((section) => {
    section.questions.forEach((q) => {
      rows.push({ section: section.title, question: q.label, answer: q.value });
    });
  });
  return rows;
};

// ── Components ──────────────────────────────────────────────────────────

function QuestionCard({ label, value, type }: A16ZQuestion) {
  const isUrl = value.startsWith("http");
  const isShort = value.length < 80 && !value.includes("\n");

  if (type === "choice") {
    return (
      <div className="flex items-start gap-3 py-3 px-1">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </div>
    );
  }

  if (isShort) {
    return (
      <div className="flex items-start gap-3 py-3 px-1">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isUrl ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              {value} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="text-sm font-semibold">{value}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="print:shadow-none">
      <CardContent className="pt-5 pb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <p className="text-sm whitespace-pre-line leading-relaxed">{value}</p>
      </CardContent>
    </Card>
  );
}

function SectionBlock({ section }: { section: A16ZSection }) {
  const shortQuestions = section.questions.filter(
    (q) => q.value.length < 80 && !q.value.includes("\n")
  );
  const longQuestions = section.questions.filter(
    (q) => q.value.length >= 80 || q.value.includes("\n")
  );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {section.icon}
        {section.title}
      </h2>

      {/* Short answers in a compact grid */}
      {shortQuestions.length > 0 && (
        <Card className="print:shadow-none">
          <CardContent className="pt-4 pb-2 grid gap-x-6 gap-y-0 sm:grid-cols-2">
            {shortQuestions.map((q) => (
              <QuestionCard key={q.label} {...q} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Long answers as individual cards */}
      {longQuestions.map((q) => (
        <QuestionCard key={q.label} {...q} />
      ))}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function A16ZSpeedrunApplication() {
  return (
    <div className="container max-w-4xl py-8 space-y-8 print:py-4 print:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            a16z Speedrun Application
          </h1>
          <p className="text-muted-foreground">
            Pre-seed — Complete Q&A Reference
          </p>
          <a 
            href="https://speedrun.a16z.com/apply/form?email=joe%40joemaushart.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
          >
            Open application form <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <ExportButtons
          pageTitle="ZenSolar a16z Speedrun Application"
          getData={getExportData}
          getFileName={() => `zensolar-a16z-speedrun-${new Date().toISOString().split("T")[0]}`}
        />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ZenSolar — a16z Speedrun Application</h1>
        <p className="text-sm text-muted-foreground">https://beta.zen.solar</p>
      </div>

      {/* Sections */}
      {APPLICATION_DATA.map((section, i) => (
        <div key={section.title}>
          <SectionBlock section={section} />
          {i < APPLICATION_DATA.length - 1 && <Separator className="mt-8" />}
        </div>
      ))}

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
        ZenSolar — a16z Speedrun Application — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
