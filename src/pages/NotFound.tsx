import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center space-y-6 px-6 max-w-md"
        >
          <Link to="/" className="inline-block">
            <img
              src={zenLogo}
              alt="ZenSolar"
              className="h-10 w-auto mx-auto dark:animate-logo-glow"
            />
          </Link>

          <div className="space-y-2">
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              404
            </motion.p>
            <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The route <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{location.pathname}</code> doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Try the Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
