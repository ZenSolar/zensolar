import { motion } from 'framer-motion';
import { UserPlus, Wallet, Shield, Smartphone, Sparkles, ArrowRight, Fingerprint, Check } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up with email, Google, or Apple. Takes 30 seconds.',
    detail: 'Standard signup—nothing unusual here.',
  },
  {
    step: 2,
    icon: Wallet,
    title: 'Choose Your Wallet',
    description: 'Create a ZenSolar Wallet or connect your existing crypto wallet.',
    detail: 'Most users choose ZenSolar Wallet—it\'s simpler.',
    highlight: true,
  },
  {
    step: 3,
    icon: Fingerprint,
    title: 'Secure with Face ID',
    description: 'One tap to set up passkey security. No passwords to remember.',
    detail: 'Your wallet is protected by your device biometrics.',
  },
  {
    step: 4,
    icon: Sparkles,
    title: 'You\'re Ready!',
    description: 'Connect your solar/EV system and start earning immediately.',
    detail: 'Rewards go directly to your wallet—automatic.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5 },
  },
};

export function SignupExplainer() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-3"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          What Happens When You Sign Up?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Your wallet is created automatically—no apps to download, no seed phrases to write down.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative max-w-2xl mx-auto"
      >
        {/* Connection line */}
        <div className="absolute left-6 md:left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/50 hidden md:block" />

        <div className="space-y-4 md:space-y-6">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              variants={itemVariants}
              className={`relative flex gap-4 md:gap-6 p-4 md:p-5 rounded-xl transition-all duration-300 ${
                item.highlight 
                  ? 'bg-primary/5 border border-primary/20' 
                  : 'bg-muted/30 border border-transparent hover:bg-muted/50'
              }`}
            >
              {/* Step indicator */}
              <div className="flex-shrink-0 relative z-10">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg ${
                  item.highlight 
                    ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground' 
                    : 'bg-muted border border-border'
                }`}>
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                
                {/* Pulse effect for highlight */}
                {item.highlight && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-primary/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {item.step}
                  </span>
                  {item.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Automatic
                    </span>
                  )}
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-primary" />
                  {item.detail}
                </p>
              </div>

              {/* Arrow to next step */}
              {index < steps.length - 1 && (
                <div className="absolute -bottom-4 md:-bottom-5 left-8 md:left-10 hidden md:block z-10">
                  <ArrowRight className="w-4 h-4 text-primary/50 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ZenSolar Wallet callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-xl mx-auto p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">
              What is ZenSolar Wallet?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It's a secure digital wallet built into the app. Your rewards are stored on the blockchain 
              (you own them, not us), but you never have to deal with crypto complexity. 
              It's secured by Face ID or Touch ID on your device.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <FeaturePill icon={Shield} label="Self-custody" />
              <FeaturePill icon={Smartphone} label="No apps needed" />
              <FeaturePill icon={Fingerprint} label="Passkey secured" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/50 border border-border/50 text-xs text-muted-foreground">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
