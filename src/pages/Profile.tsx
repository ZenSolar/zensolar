import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Wallet, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.display_name ?? 'ZenSolar User'}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">{profile?.created_at ? formatDate(profile.created_at) : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="text-sm font-medium font-mono">
                  {profile?.wallet_address 
                    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
                    : 'Not connected'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Services</CardTitle>
          <CardDescription>Your linked energy and social accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Energy Providers</h4>
            <div className="flex flex-wrap gap-2">
              <ConnectionBadge label="Tesla" connected={profile?.tesla_connected} />
              <ConnectionBadge label="Enphase" connected={profile?.enphase_connected} />
              <ConnectionBadge label="SolarEdge" connected={profile?.solaredge_connected} />
            </div>
            
            <h4 className="text-sm font-medium text-muted-foreground mt-4">Social Accounts</h4>
            <div className="flex flex-wrap gap-2">
              <ConnectionBadge label="Facebook" connected={profile?.facebook_connected} />
              <ConnectionBadge label="Instagram" connected={profile?.instagram_connected} />
              <ConnectionBadge label="TikTok" connected={profile?.tiktok_connected} />
              <ConnectionBadge label="X" connected={profile?.twitter_connected} />
              <ConnectionBadge label="LinkedIn" connected={profile?.linkedin_connected} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionBadge({ label, connected }: { label: string; connected?: boolean | null }) {
  return (
    <Badge variant={connected ? "default" : "secondary"} className="gap-1">
      {connected ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );
}
