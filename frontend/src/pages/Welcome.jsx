import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Film, Heart, Search, Sparkles, Star, Users, Zap, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Sparkles, title: "AI-Powered Emotions", desc: "Our AI analyzes thousands of films to match your current mood perfectly." },
  { icon: Users, title: "Couple Space", desc: "Connect with your partner and discover your mutual movie soulmates." },
  { icon: Heart, title: "Smart Favorites", desc: "Build your watchlist, rate films, and track what you've seen." },
  { icon: Search, title: "Deep Search", desc: "Search by title, genre, or emotion — find exactly what you're craving." },
];

const steps = [
  { num: "01", title: "Choose Your Mood", desc: "Pick an emotion or type your vibe — our AI does the rest." },
  { num: "02", title: "Browse Recommendations", desc: "Explore curated movies tailored to how you feel tonight." },
  { num: "03", title: "Watch Together", desc: "Add to couple watchlist, mark as watched, and rate together." },
];

const testimonials = [
  { name: "Alex & Jordan", text: "We found our new favorite movie on the first try. The emotion matching is scarily accurate!", rating: 5 },
  { name: "Sam & Riley", text: "No more scrolling for hours. CoupleMovie picks the perfect film every time.", rating: 5 },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered movie discovery for couples
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
            Your Perfect
            <br />
            <span className="gradient-text">Movie Night</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Discover movies that match your emotions, build shared watchlists with your partner, and never waste a night scrolling again.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to={createPageUrl("Register")}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full gap-2 px-8 shadow-lg shadow-primary/20">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={createPageUrl("Login")}>
              <Button variant="outline" size="lg" className="rounded-full border-border text-foreground hover:bg-secondary px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-muted-foreground">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">10K+</p>
              <p className="text-xs">Movies</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">32</p>
              <p className="text-xs">Emotions</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-xs">Free</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Everything you need for the <span className="gradient-text">perfect night</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From AI recommendations to couple watchlists, we've got every feature covered.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <feat.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            How it <span className="gradient-text">works</span>
          </h2>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-6 rounded-xl border border-border bg-card p-6"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                {step.num}
              </span>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Loved by <span className="gradient-text">couples</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <Quote className="mb-4 h-6 w-6 text-primary/40" />
              <p className="mb-4 text-muted-foreground leading-relaxed">{t.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center rounded-2xl border border-border bg-gradient-to-b from-primary/5 to-transparent p-12"
        >
          <Film className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-4 text-3xl font-bold">Ready for your next movie night?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Sign up for free and start discovering movies that match your mood.
          </p>
          <Link to={createPageUrl("Register")}>
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full gap-2 px-8 shadow-lg shadow-primary/20">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CoupleMovie. All rights reserved.</p>
      </footer>
    </div>
  );
}