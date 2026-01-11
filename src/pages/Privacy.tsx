import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mx-auto">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <div>
            <h4 className="font-semibold">Account Information</h4>
            <ul>
              <li>Email address</li>
              <li>Display name (optional)</li>
              <li>Profile picture (optional)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Energy Data</h4>
            <ul>
              <li>Solar production data from connected systems</li>
              <li>EV charging and mileage data (when connected)</li>
              <li>Battery storage usage (when connected)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Wallet Information</h4>
            <ul>
              <li>Public wallet address (when connected)</li>
              <li>We never access or store private keys</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ul>
            <li>Calculate and distribute token rewards based on verified energy production</li>
            <li>Mint NFTs for achievement milestones</li>
            <li>Display your energy metrics in your dashboard</li>
            <li>Send notifications about rewards and milestones (with consent)</li>
            <li>Improve our service and develop new features</li>
            <li>Respond to support requests</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Data Sharing</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li><strong>Service providers:</strong> Cloud hosting, analytics (with appropriate protections)</li>
            <li><strong>Blockchain networks:</strong> Transaction data is public on the blockchain by design</li>
            <li><strong>Legal requirements:</strong> If required by law or to protect rights</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Third-Party Connections</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>When you connect third-party services (Enphase, Tesla, SolarEdge):</p>
          <ul>
            <li>We use OAuth for secure authentication</li>
            <li>We only request permissions necessary for energy data</li>
            <li>Access tokens are encrypted and stored securely</li>
            <li>You can revoke access at any time through Settings</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ul>
            <li>All data is encrypted in transit (TLS) and at rest</li>
            <li>We use industry-standard security practices</li>
            <li>Regular security audits and monitoring</li>
            <li>Limited employee access to user data</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request account and data deletion</li>
            <li><strong>Portability:</strong> Export your data</li>
            <li><strong>Opt-out:</strong> Disable notifications and data sharing</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, visit Settings or contact{" "}
            <a href="mailto:privacy@zen.solar" className="text-primary hover:underline">
              privacy@zen.solar
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ul>
            <li>Account data: Retained until you delete your account</li>
            <li>Energy production data: Retained for reward calculations and historical tracking</li>
            <li>Transaction data: Permanently recorded on blockchain (cannot be deleted)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">8. Cookies & Analytics</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ul>
            <li>We use essential cookies for authentication and preferences</li>
            <li>Analytics help us understand usage patterns (anonymized)</li>
            <li>No third-party advertising cookies</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            For privacy-related questions or to exercise your rights:
          </p>
          <p className="mt-2">
            Email:{" "}
            <a href="mailto:privacy@zen.solar" className="text-primary hover:underline">
              privacy@zen.solar
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
