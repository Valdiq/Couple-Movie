import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Heart, Users, Sparkles, Crown, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try { const currentUser = await User.me(); setUser(currentUser); } catch (e) { setUser(null); }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const handleUpgrade = async () => {
    if (!user) { User.loginWithRedirect(window.location.href); return; }
    try {
      setIsLoading(true);
      await User.updateMyUserData({ subscription_plan: 'pro' });
      const updatedUser = await User.me();
      setUser(updatedUser);
    } catch (error) { alert("Error processing upgrade. Please try again."); }
    finally { setIsLoading(false); }
  };

  const freeFeatures = [
    "Emotion-based movie discovery",
    "AI-powered natural language search",
    "Personal favorites list",
    "Basic movie details & ratings",
    "Mobile & desktop access",
    "Up to 50 movies in favorites"
  ];

  const premiumFeatures = [
    "Everything in Free",
    "Couple Space & partner invitations",
    "Shared watchlists for couples",
    "Mutual movie matching system",
    "Individual rating system (1-5 stars)",
    "Watch history tracking",
    "Advanced AI recommendations for couples",
    "Priority customer support",
    "Unlimited favorites",
    "Early access to new features"
  ];

  const faqs = [
    { q: "Can I try Pro features before subscribing?", a: "Yes! We offer a 7-day free trial for all Pro features. Cancel anytime during the trial period." },
    { q: "What happens if my partner doesn't have Pro?", a: "Both partners need Pro to access Couple Space features. You can invite your partner and they'll get a special trial offer." },
    { q: "Can I use the app with friends?", a: "Absolutely! The 'Couple Space' works perfectly for friends who want to share movie recommendations and watch together." },
    { q: "How does the mutual movie matching work?", a: "Our AI analyzes both partners' preferences, ratings, and mood selections to suggest movies you'll both enjoy." }
  ];

  const comparisonRows = [
    ["Personal movie discovery", true, true],
    ["AI-powered search", true, true],
    ["Favorites list", "50 movies", "Unlimited"],
    ["Couple Space", false, true],
    ["Shared watchlists", false, true],
    ["Movie matching system", false, true],
    ["Individual ratings", false, true],
    ["Watch history tracking", false, true],
    ["Priority support", false, true],
    ["Early access features", false, true]
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Choose Your Perfect
            <br />
            <span className="gradient-text">Movie Experience</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Start free with personal movie discovery, or upgrade to unlock the full couple experience
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Free Plan */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">Free</h3>
              <div className="mb-2 text-4xl font-bold text-foreground">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground">Perfect for individual movie lovers</p>
            </div>
            <ul className="mb-8 flex-grow space-y-4">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-green-400" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-auto w-full bg-secondary py-3 text-lg text-foreground hover:bg-secondary/80"
              disabled={user?.subscription_plan === 'free'}
              onClick={() => !user && User.login()}>
              {user?.subscription_plan === 'free' ? "Your Current Plan" : (user ? "Current Plan" : "Get Started Free")}
            </Button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card p-8">
            <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-primary/10 to-accent/10 blur-xl" />
            {user?.subscription_plan === 'pro' ? (
              <Badge className="absolute right-6 top-6 border-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white gap-1">
                <Check className="h-3 w-3" /> Active Plan
              </Badge>
            ) : (
              <Badge className="absolute right-6 top-6 border-0 bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1">
                <Crown className="h-3 w-3" /> Most Popular
              </Badge>
            )}
            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">CoupleMovie Pro</h3>
              <div className="mb-2 text-4xl font-bold text-foreground">$15<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground">The ultimate experience for couples & friends</p>
            </div>
            <ul className="relative mb-8 flex-grow space-y-4">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className={`${i === 0 ? 'text-muted-foreground' : 'text-foreground'} ${i > 0 && i <= 6 ? 'font-medium' : ''}`}>
                    {feature}
                  </span>
                  {i > 0 && i <= 6 && <Sparkles className="ml-auto h-4 w-4 text-accent" />}
                </li>
              ))}
            </ul>
            <Button onClick={handleUpgrade} disabled={isLoading || user?.subscription_plan === 'pro'}
              className="relative mt-auto w-full bg-gradient-to-r from-primary to-accent py-3 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 gap-2">
              <Zap className="h-5 w-5" />
              {user?.subscription_plan === 'pro' ? 'You are a Pro' : 'Upgrade to Pro'}
            </Button>
            <p className="relative mt-4 text-center text-sm text-muted-foreground">Cancel anytime · 7-day free trial</p>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Feature Comparison</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-3 gap-4 bg-secondary/50 p-6">
              <div />
              <div className="text-center"><h4 className="font-semibold text-foreground">Free</h4></div>
              <div className="text-center">
                <h4 className="font-semibold text-foreground">Pro</h4>
                <Badge className="mt-1 border-0 bg-gradient-to-r from-primary to-accent text-xs text-primary-foreground">$15/mo</Badge>
              </div>
            </div>
            {comparisonRows.map(([feature, free, pro], i) => (
              <div key={i} className="grid grid-cols-3 gap-4 border-t border-border p-4">
                <div className="font-medium text-foreground">{feature}</div>
                <div className="text-center">
                  {typeof free === 'boolean' ? (
                    free ? <Check className="mx-auto h-5 w-5 text-green-400" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" />
                  ) : <span className="text-sm text-muted-foreground">{free}</span>}
                </div>
                <div className="text-center">
                  {typeof pro === 'boolean' ? (
                    pro ? <Check className="mx-auto h-5 w-5 text-accent" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" />
                  ) : <span className="text-sm font-medium text-foreground">{pro}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-20 text-center">
          <h2 className="mb-8 text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="mx-auto max-w-3xl space-y-4 text-left">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left font-semibold text-foreground">
                  {q}
                  {openFaq === i ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <p className="px-5 pb-5 text-muted-foreground">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-20 text-center">
          <div className="rounded-2xl border border-border bg-gradient-to-b from-primary/5 to-transparent p-12">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to Transform Your Movie Nights?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Join thousands of couples who've discovered their perfect movie matches with CoupleMovie Pro
            </p>
            <div className="flex justify-center gap-4">
              <Link to={createPageUrl("Home")}>
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">Try Free Version</Button>
              </Link>
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 gap-2"
                onClick={handleUpgrade} disabled={isLoading || user?.subscription_plan === 'pro'}>
                <Crown className="h-4 w-4" /> Start Pro Trial
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
