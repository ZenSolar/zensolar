import { useCallback, useEffect, useMemo, useState } from "react";
import { waitForServiceWorkerReady } from "@/lib/serviceWorker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bug, RefreshCw, Trash2, BellRing, Radio } from "lucide-react";

type SwRegistrationInfo = {
  scope: string;
  activeScriptURL?: string;
  waitingScriptURL?: string;
  installingScriptURL?: string;
};

type PushDiag = {
  permission: NotificationPermission | "unsupported";
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  controllerScriptURL?: string;
  registrations: SwRegistrationInfo[];
  subscriptionEndpoint?: string;
  displayMode?: string;
  userAgent: string;
};

type LastPushRecord = {
  at: number;
  title?: string;
  body?: string;
  shown?: boolean;
  error?: string;
  data?: unknown;
};

function safePrefix(str: string | undefined, n = 64) {
  if (!str) return undefined;
  return str.length <= n ? str : `${str.slice(0, n)}…`;
}

function isOurExpectedSw(scriptURL: string | undefined) {
  if (!scriptURL) return false;
  // Our custom push SW lives at /sw.js
  return scriptURL.includes("/sw.js");
}

async function readLastPushFromCache(): Promise<LastPushRecord | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open("zensolar-push-diag");
    const res = await cache.match("/__zensolar_last_push");
    if (!res) return null;
    const json = (await res.json()) as LastPushRecord;
    if (!json?.at) return null;
    return json;
  } catch {
    return null;
  }
}

export default function PushDiagnosticsCard() {
  const [diag, setDiag] = useState<PushDiag | null>(null);
  const [lastPush, setLastPush] = useState<LastPushRecord | null>(null);
  const [lastPong, setLastPong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isSupported = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const hasServiceWorker = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;

      const permission: PushDiag["permission"] =
        "Notification" in window ? Notification.permission : "unsupported";

      const displayMode = (() => {
        try {
          if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
          if (window.matchMedia("(display-mode: browser)").matches) return "browser";
          return "unknown";
        } catch {
          return "unknown";
        }
      })();

      let registrations: SwRegistrationInfo[] = [];
      let controllerScriptURL: string | undefined;
      let subscriptionEndpoint: string | undefined;

      if (hasServiceWorker) {
        controllerScriptURL = (navigator.serviceWorker.controller as any)?.scriptURL;

        const regs = await navigator.serviceWorker.getRegistrations();
        registrations = regs.map((r) => ({
          scope: r.scope,
          activeScriptURL: r.active?.scriptURL,
          waitingScriptURL: r.waiting?.scriptURL,
          installingScriptURL: r.installing?.scriptURL,
        }));

        try {
          const readyReg = await waitForServiceWorkerReady(1500);
          if (readyReg) {
            const sub = await readyReg.pushManager.getSubscription();
            subscriptionEndpoint = sub?.endpoint;
          }
        } catch {
          // ignore
        }
      }

      setDiag({
        permission,
        hasServiceWorker,
        hasPushManager,
        controllerScriptURL,
        registrations,
        subscriptionEndpoint,
        displayMode,
        userAgent: navigator.userAgent,
      });

      setLastPush(await readLastPushFromCache());
    } catch (e) {
      console.error("[PushDiagnostics] load failed", e);
      toast.error("Failed to load push diagnostics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "PONG") {
        setLastPong(data);
      }

      if (data.type === "PUSH_DIAG" && data.record) {
        setLastPush(data.record);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  const unregisterAll = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Service workers not supported in this browser");
      return;
    }

    setLoading(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      toast.success("Service workers unregistered and caches cleared");
      window.location.reload();
    } catch (e) {
      console.error("[PushDiagnostics] unregister failed", e);
      toast.error("Failed to unregister service workers");
    } finally {
      setLoading(false);
    }
  }, []);

  const pingServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Service worker not available");
      return;
    }

    try {
      const reg = await waitForServiceWorkerReady(1500);
      if (!reg?.active) {
        toast.error("Service worker not ready (try reopening the app)");
        return;
      }
      reg.active.postMessage({ type: "PING" });
      toast.success("Pinged service worker");
    } catch (e) {
      console.error("[PushDiagnostics] ping failed", e);
      toast.error("Failed to ping service worker");
    }
  }, []);

  const testLocalNotification = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Notification permission not granted");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        toast.error("Service worker not available");
        return;
      }

      const reg = await waitForServiceWorkerReady(1500);
      if (!reg) {
        toast.error("Service worker not ready (try reopening the app)");
        return;
      }

      await reg.showNotification("ZenSolar Local Test", {
        body: "If you see this, iOS notifications are enabled for the app.",
        tag: "zensolar-local-test",
      });

      toast.success("Local notification requested");
    } catch (e) {
      console.error("[PushDiagnostics] local notification failed", e);
      toast.error("Local notification failed");
    }
  }, []);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Push Diagnostics</CardTitle>
          </div>
          <CardDescription>Push APIs aren't available in this environment.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const controllerOk = isOurExpectedSw(diag?.controllerScriptURL);
  const anyActiveOk = (diag?.registrations ?? []).some((r) => isOurExpectedSw(r.activeScriptURL));

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Push Diagnostics</CardTitle>
        </div>
        <CardDescription>
          Confirms which service worker is active, whether it is our custom <code>/sw.js</code>, and whether the device is actually receiving pushes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadDiagnostics} disabled={loading}>
            <RefreshCw className={"h-4 w-4 mr-2 " + (loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button variant="outline" onClick={pingServiceWorker} disabled={loading}>
            <Radio className="h-4 w-4 mr-2" />
            Ping SW
          </Button>
          <Button variant="outline" onClick={testLocalNotification} disabled={loading}>
            <BellRing className="h-4 w-4 mr-2" />
            Local notification
          </Button>
          <Button variant="destructive" onClick={unregisterAll} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Unregister SW + clear cache
          </Button>
        </div>

        {diag && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">permission: {diag.permission}</Badge>
              <Badge variant="secondary">display: {diag.displayMode}</Badge>
              <Badge variant={diag.hasServiceWorker ? "default" : "destructive"}>
                serviceWorker: {diag.hasServiceWorker ? "yes" : "no"}
              </Badge>
              <Badge variant={diag.hasPushManager ? "default" : "destructive"}>
                pushManager: {diag.hasPushManager ? "yes" : "no"}
              </Badge>
              <Badge variant={controllerOk ? "default" : "destructive"}>
                controller: {controllerOk ? "sw.js" : "NOT sw.js"}
              </Badge>
              <Badge variant={anyActiveOk ? "default" : "destructive"}>
                registration: {anyActiveOk ? "sw.js" : "NOT sw.js"}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Controller script</div>
              <div className="font-mono text-xs break-all">{diag.controllerScriptURL ?? "(none)"}</div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Push subscription endpoint</div>
              <div className="font-mono text-xs break-all">
                {diag.subscriptionEndpoint ? safePrefix(diag.subscriptionEndpoint, 120) : "(none)"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Last push received by SW</div>
              <div className="font-mono text-xs break-all">
                {lastPush
                  ? `${new Date(lastPush.at).toISOString()} | shown=${String(lastPush.shown)} | ${safePrefix(lastPush.error, 160) ?? "ok"}`
                  : "(no record yet)"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Last SW pong</div>
              <div className="font-mono text-xs break-all">{lastPong ? JSON.stringify(lastPong) : "(none)"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground">Service worker registrations</div>
              {diag.registrations.length === 0 ? (
                <div className="text-muted-foreground">(none)</div>
              ) : (
                <div className="space-y-2">
                  {diag.registrations.map((r) => (
                    <div key={r.scope} className="rounded-md border border-border p-3">
                      <div className="font-medium">scope</div>
                      <div className="font-mono text-xs break-all">{r.scope}</div>
                      <div className="mt-2 grid gap-1">
                        <div>
                          <span className="text-muted-foreground">active:</span>{" "}
                          <span className="font-mono text-xs break-all">{r.activeScriptURL ?? "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">waiting:</span>{" "}
                          <span className="font-mono text-xs break-all">{r.waitingScriptURL ?? "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">installing:</span>{" "}
                          <span className="font-mono text-xs break-all">{r.installingScriptURL ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details className="rounded-md border border-border p-3">
              <summary className="cursor-pointer text-muted-foreground">User agent</summary>
              <div className="mt-2 font-mono text-xs break-all">{diag.userAgent}</div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
