import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mx-auto">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: January 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            By accessing or using ZenSolar ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Beta Program</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            ZenSolar is currently in beta. During this period:
          </p>
          <ul>
            <li>All tokens ($ZSOLAR) and NFTs are minted on the Sepolia testnet and have no monetary value</li>
            <li>Features may change, be added, or removed without notice</li>
            <li>Data and tokens may be reset during the beta period</li>
            <li>We make no guarantees about uptime or service availability</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Account Registration</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            To use ZenSolar, you must create an account with accurate information. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Energy Data & Third-Party Connections</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            When you connect your solar system (Enphase, Tesla, SolarEdge) to ZenSolar:
          </p>
          <ul>
            <li>You authorize us to access your energy production data</li>
            <li>We only collect data necessary to calculate rewards</li>
            <li>You can disconnect your accounts at any time</li>
            <li>Third-party services are subject to their own terms of service</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Tokens and NFTs</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            $ZSOLAR tokens and NFTs are:
          </p>
          <ul>
            <li>Not securities or investments</li>
            <li>Not redeemable for cash or monetary value (during beta)</li>
            <li>Subject to tokenomics that may change based on community feedback</li>
            <li>Minted on blockchain networks which may incur gas fees</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. Wallet Connection</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            When connecting a cryptocurrency wallet:
          </p>
          <ul>
            <li>You are solely responsible for your wallet security</li>
            <li>We never have access to your private keys</li>
            <li>Transactions on the blockchain are irreversible</li>
            <li>You must ensure you're connected to the correct network</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7. Prohibited Conduct</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>You agree not to:</p>
          <ul>
            <li>Provide false or misleading energy data</li>
            <li>Attempt to manipulate or game the reward system</li>
            <li>Use the Service for illegal purposes</li>
            <li>Interfere with the Service's operation</li>
            <li>Create multiple accounts to gain unfair advantages</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">8. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            ZenSolar is provided "as is" without warranties. We are not liable for:
          </p>
          <ul>
            <li>Loss of tokens or NFTs</li>
            <li>Inaccurate reward calculations</li>
            <li>Third-party service outages</li>
            <li>Blockchain network issues</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9. Contact</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:legal@zen.solar" className="text-primary hover:underline">
              legal@zen.solar
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
