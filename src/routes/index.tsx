import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Sparkles,
  Receipt,
  Boxes,
  Users,
  BarChart3,
  ShieldCheck,
  Clock3,
  Rocket,
  MousePointerClick,
  MessageCircle,
  Smartphone,
  Building2,
  Mail,
  Phone,
  MapPin,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Lock,
  Globe,
  Play,
  Brain,
  Database,
  Layers,
  FileText,
  Bell,
  Cloud,
  Key,
  CheckCircle2,
  ArrowUpRight,
  ChevronDown,
  Zap,
  UserCog,
  Puzzle,
  Bot,
  Printer,
  QrCode,
  Scan,
  Warehouse,
  Shield,
  Server,
  LayoutDashboard,
  Package,
  LineChart,
  CreditCard,
  GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

/* ─────────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────────── */

function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#home" className={"flex items-center gap-2.5 " + className}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-[var(--shadow-elegant)]">
        <span className="absolute inset-0.5 rounded-[10px] bg-black/15" />
        <span className="relative text-sm font-black text-white tracking-tight">N</span>
      </span>
      <span className="text-[17px] font-bold tracking-tight text-foreground">
        Nexora
      </span>
    </a>
  );
}

function Btn({
  children,
  href = "#",
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "outline" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-sm",
  };
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ${sizes[size]}`;

  if (variant === "primary")
    return (
      <a href={href} className={`${base} bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-16px_oklch(0.62_0.22_258/0.55)] ${className}`}>
        {children}
      </a>
    );
  if (variant === "white")
    return (
      <a href={href} className={`${base} bg-white text-[color:var(--brand-deep)] hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
        {children}
      </a>
    );
  if (variant === "outline")
    return (
      <a href={href} className={`${base} border border-border bg-transparent text-foreground hover:bg-secondary hover:border-[color:var(--brand-electric)]/40 ${className}`}>
        {children}
      </a>
    );
  return (
    <a href={href} className={`${base} border border-border bg-background/60 text-foreground backdrop-blur hover:bg-secondary ${className}`}>
      {children}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-electric)]">
      <span className="h-px w-5 bg-[color:var(--brand-electric)]/50" />
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryLinks = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "About", href: "#about" },
    { label: "Pricing", href: "#pricing" },
  ];
  const platformLinks = [
    { label: "Nexora AI", href: "#ai" },
    { label: "AI Agents", href: "#agents" },
    { label: "Workflow tour", href: "#workflow" },
    { label: "Business dashboard", href: "#dashboard" },
    { label: "Integrations", href: "#integrations" },
    { label: "Security", href: "#security" },
  ];
  const moreLinks = [
    { label: "Business metrics", href: "#proof" },
    { label: "Customer community", href: "#customer-proof" },
    { label: "Customer stories", href: "#stories" },
    { label: "Product roadmap", href: "#roadmap" },
    { label: "FAQs & resources", href: "#faq" },
    { label: "Contact & demo", href: "#contact" },
    { label: "Get started", href: "#get-started" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/80 border-b border-border/60 shadow-[0_1px_0_oklch(0.14_0.02_260/0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />

        <nav aria-label="Main navigation" className="hidden items-center gap-4 lg:flex xl:gap-5">
          {primaryLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          {[
            { label: "Platform", items: platformLinks },
            { label: "Explore", items: moreLinks },
          ].map((menu) => (
            <details key={menu.label} className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                {menu.label}<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {menu.items.map((item) => <a key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700">{item.label}</a>)}
              </div>
            </details>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Login
          </a>
          <Btn href="#contact" variant="outline" size="sm">
            Book Demo
          </Btn>
          <Btn href="/signup" size="sm">
            Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
          </Btn>
        </div>

        <button
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-h-[calc(100vh-4.5rem)] max-w-7xl flex-col gap-1 overflow-y-auto px-6 py-4">
            {[...primaryLinks, ...platformLinks, ...moreLinks].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                Login
              </a>
              <Btn href="#contact" variant="outline" className="justify-center">
                Book Demo
              </Btn>
              <Btn href="/signup" className="justify-center">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section id="home" className="landing-hero relative overflow-hidden bg-hero-glow pt-32 pb-20 lg:pt-44 lg:pb-28">
      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(oklch(0.14_0.02_260/0.035)_1px,transparent_1px),linear-gradient(90deg,oklch(0.14_0.02_260/0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left */}
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-electric)]/25 bg-[color:var(--brand-electric)]/8 px-3.5 py-1.5 text-xs font-semibold text-[color:var(--brand-electric)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--brand-electric)]" />
            Nexora AI 2.0 — Now available
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[1.03] tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem]">
            The AI Business{" "}
            <span className="text-gradient">Operating System.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            One intelligent platform to run billing, inventory, customers, finance
            and teams — with an AI that reads your business and takes real action,
            not just gives advice.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Btn href="/signup" size="lg">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Btn>
            <Btn href="#contact" variant="outline" size="lg">
              Book Demo
            </Btn>
            <a
              href="#ai"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch product tour
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["14-day free trial", "No credit card required", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[color:var(--brand-electric)]" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Hero dashboard */}
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative animate-rise [animation-delay:100ms]">
      {/* Glow */}
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[image:var(--gradient-brand)] opacity-[0.15] blur-3xl" />

      {/* Main dashboard card */}
      <div className="glass rounded-3xl p-3 shadow-[var(--shadow-elegant)]">
        <div className="overflow-hidden rounded-2xl bg-[color:var(--brand-deep)] shadow-inner">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-[10px] text-white/40">
              nexora.app / dashboard
            </span>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 uppercase tracking-wider">
              Live
            </span>
          </div>

          {/* Dashboard content */}
          <div className="p-4 text-white">
            {/* Greeting */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-white/40">Good morning, Aarav · Monday, 14 July</p>
                <p className="text-base font-semibold mt-0.5">Business Overview</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 cursor-pointer hover:bg-white/15 transition-colors">
                  <Bell className="h-3.5 w-3.5 text-white/70" />
                </span>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "Revenue", value: "₹1,24,860", tone: "text-emerald-300", delta: "+18%" },
                { label: "Orders", value: "348", tone: "text-sky-300", delta: "+12%" },
                { label: "Customers", value: "1,284", tone: "text-violet-300", delta: "+5%" },
                { label: "Profit", value: "₹41,220", tone: "text-amber-300", delta: "+9%" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/5 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">{s.label}</p>
                  <p className={`mt-1 text-sm font-bold ${s.tone}`}>{s.value}</p>
                  <p className="text-[9px] text-emerald-400 mt-0.5">{s.delta}</p>
                </div>
              ))}
            </div>

            {/* Chart + panels row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Revenue chart */}
              <div className="col-span-2 rounded-xl bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between text-[10px]">
                  <span className="text-white/50">Revenue · last 14 days</span>
                  <span className="text-emerald-400 font-semibold">+18.4%</span>
                </div>
                <div className="flex h-16 items-end gap-1">
                  {[38, 52, 44, 61, 55, 72, 65, 80, 74, 88, 82, 95, 90, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[color:var(--brand-electric)]/30 to-[color:var(--brand-electric)]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              {/* Inventory */}
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/40 mb-2">Inventory</p>
                {[
                  { name: "Amul Gold 1L", pct: 78, color: "bg-emerald-400" },
                  { name: "Tata Salt 1kg", pct: 12, color: "bg-red-400" },
                  { name: "Colgate 150g", pct: 55, color: "bg-sky-400" },
                ].map((item) => (
                  <div key={item.name} className="mb-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-white/50 truncate">{item.name}</span>
                      <span className="text-[9px] text-white/50">{item.pct}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent invoices */}
            <div className="mt-2 rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-white/60">Recent Invoices</p>
                <p className="text-[9px] text-[color:var(--brand-glow)] cursor-pointer">View all →</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Priya Traders", amt: "₹24,780", status: "Paid", color: "text-emerald-400" },
                  { name: "Cascade Foods", amt: "₹18,900", status: "Pending", color: "text-amber-400" },
                  { name: "Halcyon Group", amt: "₹1,20,000", status: "Overdue", color: "text-red-400" },
                ].map((inv) => (
                  <div key={inv.name} className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">{inv.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{inv.amt}</span>
                      <span className={`${inv.color} font-medium`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: AI insight */}
      <div className="absolute -left-5 bottom-6 hidden animate-float sm:block">
        <div className="glass rounded-2xl px-4 py-3 min-w-[230px] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-lg bg-[image:var(--gradient-brand)]">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            Nexora AI
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            "Tata Salt 1kg is critically low (4 units). Reorder now to avoid Friday stockout."
          </p>
        </div>
      </div>

      {/* Floating: Business health */}
      <div className="absolute -right-5 top-8 hidden animate-float-slower md:block">
        <div className="glass rounded-2xl px-4 py-3 min-w-[190px] shadow-lg">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Health Score</p>
          <p className="mt-1 text-2xl font-black text-foreground">92 <span className="text-sm font-medium text-emerald-500">/ 100</span></p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
            <div className="h-full w-[92%] rounded-full bg-[image:var(--gradient-brand)]" />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">Excellent · 2 alerts</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STATS BANNER
───────────────────────────────────────────────────────────────── */

function StatsBanner() {
  const stats = [
    { value: "12,000+", label: "Businesses running on Nexora" },
    { value: "₹500 Cr+", label: "Invoices processed monthly" },
    { value: "4.9 / 5", label: "Average customer rating" },
    { value: "99.9%", label: "Platform uptime SLA" },
  ];
  return (
    <section id="proof" className="landing-proof border-y border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TRUSTED BY
───────────────────────────────────────────────────────────────── */

function TrustedBy() {
  const logos = [
    "Northwind Co.", "Cascade Foods", "Meridian Retail", "Lumen Group",
    "Vertex Trade", "Halcyon Mart", "Pinnacle Stores", "Solaris Pharma",
    "BluePath Tech", "Zenith Foods", "Orbit Logistics", "Crestline Co.",
  ];
  return (
    <section id="customer-proof" className="landing-trust py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by 12,000+ growing Indian businesses
        </p>
      </div>
      <div className="mt-8 flex gap-0">
        <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12">
          {logos.map((l) => (
            <span
              key={l}
              className="whitespace-nowrap text-base font-bold tracking-tight text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              {l}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="flex shrink-0 animate-marquee items-center gap-12 pr-12">
          {logos.map((l) => (
            <span
              key={l + "-dup"}
              className="whitespace-nowrap text-base font-bold tracking-tight text-muted-foreground/50"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FEATURE SHOWCASE — reusable alternating layout
───────────────────────────────────────────────────────────────── */

/* FeatureShowcase removed — replaced by ProductShowcase below */

/* ─────────────────────────────────────────────────────────────────
   LARGE PREVIEW SHELL (browser-style, more premium)
───────────────────────────────────────────────────────────────── */

function PreviewShell({
  title,
  children,
  right,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        <div className="text-[11px] text-muted-foreground">{right}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LargePreviewShell({
  url,
  badge,
  children,
  floats,
}: {
  url: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  floats?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-brand)] opacity-[0.12] blur-3xl" />

      {/* Browser window */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_-20px_oklch(0.14_0.02_260/0.22),0_0_0_1px_oklch(0.14_0.02_260/0.05)]">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
          <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-border/60 px-3 py-1.5">
            <span className="text-[11px] text-muted-foreground/60">nexora.app /</span>
            <span className="text-[11px] font-medium text-muted-foreground">{url}</span>
          </div>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>

      {/* Floating cards */}
      {floats}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BILLING PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function BillingMockup() {
  return (
    <LargePreviewShell
      url="billing / invoices"
      badge={
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
          GST Ready
        </span>
      }
      floats={
        <>
          {/* Floating: revenue card */}
          <div className="absolute -right-6 top-16 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[160px]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today's Collections</p>
              <p className="mt-1.5 text-xl font-black text-foreground">₹64,320</p>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">↑ 12% vs yesterday</p>
            </div>
          </div>
          {/* Floating: QR sent */}
          <div className="absolute -left-6 bottom-10 hidden animate-float lg:block">
            <div className="glass rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" />
                </span>
                Payment received
              </div>
              <p className="mt-1 text-xs text-muted-foreground">₹24,780 · Priya Traders</p>
            </div>
          </div>
        </>
      }
    >
      {/* Invoice detail */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[color:var(--brand-electric)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--brand-electric)] uppercase tracking-wider">INV-1042</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">Paid</span>
          </div>
          <p className="text-sm font-bold text-foreground">Priya Traders Pvt. Ltd.</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">GSTIN 29ABCDE1234F1Z5 · Due: 20 July</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="text-2xl font-black text-foreground mt-0.5">₹24,780</p>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2 mb-4">
        {[
          { name: "Amul Gold 1L × 24 crates", qty: "576 units", gst: "5%", amt: "₹1,440" },
          { name: "Tata Salt 1kg × 40 bags", qty: "40 units", gst: "0%", amt: "₹960" },
          { name: "Maggi 70g × 60 boxes", qty: "60 units", gst: "18%", amt: "₹840" },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-xs">
            <div>
              <p className="font-medium text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.qty}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-[10px] text-muted-foreground">GST {r.gst}</span>
              <span className="font-semibold text-foreground min-w-[52px]">{r.amt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GST summary */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-[color:var(--brand-electric)]/25 bg-[color:var(--brand-electric)]/5 px-4 py-3 mb-4">
        <div>
          <p className="text-[11px] text-muted-foreground">CGST 9% + SGST 9% — Auto calculated</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Tax</p>
          <p className="text-sm font-bold text-[color:var(--brand-electric)]">₹3,780</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { icon: QrCode, label: "UPI QR", style: "bg-secondary text-foreground border border-border" },
          { icon: Printer, label: "Thermal Print", style: "bg-secondary text-foreground border border-border" },
          { icon: FileText, label: "PDF Export", style: "bg-secondary text-foreground border border-border" },
          { icon: Check, label: "Mark Paid", style: "bg-[image:var(--gradient-brand)] text-white" },
        ].map(({ icon: Icon, label, style }) => (
          <button key={label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${style} transition-all hover:opacity-90`}>
            <Icon className="h-3 w-3" /> {label}
          </button>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INVENTORY PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function InventoryMockup() {
  const rows = [
    { name: "Amul Gold 1L", sku: "SKU-0021", stock: 128, capacity: 200, pct: 64, tone: "bg-emerald-400", status: "Healthy" },
    { name: "Tata Salt 1kg", sku: "SKU-0034", stock: 4, capacity: 100, pct: 4, tone: "bg-red-400", status: "Critical" },
    { name: "Maggi 70g", sku: "SKU-0058", stock: 9, capacity: 80, pct: 11, tone: "bg-amber-400", status: "Low" },
    { name: "Colgate MaxFresh", sku: "SKU-0072", stock: 46, capacity: 80, pct: 57, tone: "bg-sky-400", status: "Healthy" },
    { name: "Britannia Good Day", sku: "SKU-0091", stock: 72, capacity: 120, pct: 60, tone: "bg-emerald-400", status: "Healthy" },
  ];
  return (
    <LargePreviewShell
      url="inventory / stock"
      badge={
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live sync
        </span>
      }
      floats={
        <>
          <div className="absolute -left-6 top-20 hidden animate-float lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-red-500">
                  <Bell className="h-3 w-3 text-white" />
                </span>
                <p className="text-xs font-semibold text-foreground">Restock Alert</p>
              </div>
              <p className="text-xs text-muted-foreground">2 items below threshold</p>
              <p className="text-xs font-semibold text-[color:var(--brand-electric)] mt-1.5 cursor-pointer">Create POs →</p>
            </div>
          </div>
          <div className="absolute -right-6 bottom-12 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total SKUs</p>
              <p className="mt-1 text-xl font-black text-foreground">1,284</p>
              <p className="text-[11px] text-muted-foreground">3 warehouses</p>
            </div>
          </div>
        </>
      }
    >
      {/* Search */}
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 px-4 py-2.5">
        <Scan className="h-4 w-4 text-muted-foreground/60" />
        <span className="text-sm text-muted-foreground/60">Scan barcode or search products…</span>
        <span className="ml-auto text-[11px] text-[color:var(--brand-electric)] font-semibold cursor-pointer">+ Add Product</span>
      </div>

      {/* Headers */}
      <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        <span>Product</span>
        <span className="text-right">Stock</span>
        <span className="w-20 text-center">Level</span>
        <span className="w-14 text-right">Status</span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.sku}</p>
            </div>
            <p className="text-sm font-bold text-foreground text-right">{r.stock}</p>
            <div className="w-20">
              <div className="h-1.5 w-full rounded-full bg-border">
                <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
            <span className={`w-14 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold ${
              r.status === "Healthy" ? "bg-emerald-50 text-emerald-700" :
              r.status === "Critical" ? "bg-red-50 text-red-600" :
              "bg-amber-50 text-amber-700"
            }`}>{r.status}</span>
          </div>
        ))}
      </div>

      {/* AI suggestion */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[color:var(--brand-electric)]/20 bg-[color:var(--brand-electric)]/5 px-4 py-3">
        <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[image:var(--gradient-brand)]">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
        <div>
          <p className="text-xs font-semibold text-foreground">AI Recommendation</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Reorder Tata Salt 1kg (200 units) and Maggi 70g (100 units) before Friday to avoid weekend stockout.</p>
        </div>
        <button className="ml-auto flex-shrink-0 rounded-full bg-[image:var(--gradient-brand)] px-3 py-1 text-[10px] font-semibold text-white">
          Order
        </button>
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CRM PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function CRMMockup() {
  const customers = [
    { name: "Meridian Retail", initials: "MR", ltv: "₹1.42L", orders: 48, tag: "VIP", health: 96, last: "2 hrs ago" },
    { name: "Cascade Foods", initials: "CF", ltv: "₹98,400", orders: 34, tag: "Loyal", health: 82, last: "Yesterday" },
    { name: "Halcyon Group", initials: "HG", ltv: "₹32,100", orders: 8, tag: "New", health: 61, last: "3 days ago" },
    { name: "Vertex Trade", initials: "VT", ltv: "₹2.18L", orders: 72, tag: "VIP", health: 99, last: "1 hr ago" },
  ];
  return (
    <LargePreviewShell
      url="crm / customers"
      badge={
        <span className="rounded-full bg-[color:var(--brand-electric)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-electric)]">
          Pipeline · Live
        </span>
      }
      floats={
        <>
          <div className="absolute -right-6 top-14 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[170px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Won (MTD)</p>
              <p className="mt-1.5 text-xl font-black text-foreground">₹6.2L</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[11px] font-semibold text-emerald-600">↑ 24%</span>
                <span className="text-[11px] text-muted-foreground">vs last month</span>
              </div>
            </div>
          </div>
        </>
      }
    >
      {/* Pipeline KPIs */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { l: "Total Customers", v: "5,821", c: "text-foreground" },
          { l: "Active Deals", v: "12", c: "text-[color:var(--brand-electric)]" },
          { l: "Due Follow-ups", v: "7", c: "text-amber-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
            <p className="text-[10px] text-muted-foreground">{k.l}</p>
            <p className={`mt-1 text-lg font-black ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {customers.map((c) => (
          <div key={c.name} className="flex items-center gap-4 rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/60 cursor-pointer">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-xs font-bold text-white">
              {c.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  c.tag === "VIP" ? "bg-[image:var(--gradient-brand)] text-white" : "bg-secondary text-muted-foreground border border-border"
                }`}>{c.tag}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">LTV {c.ltv} · {c.orders} orders · {c.last}</p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="h-1 w-16 rounded-full bg-border">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${c.health}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.health}% health</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REPORTS PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function ReportsMockup() {
  const bars = [32, 48, 38, 60, 52, 70, 62, 80, 72, 88, 78, 95];
  const points = [18, 28, 22, 38, 32, 48, 42, 56, 50, 64, 58, 72];
  const w = 500;
  const h = 100;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / 100) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <LargePreviewShell
      url="analytics / overview"
      badge={
        <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-600">
          Live · Auto-refresh
        </span>
      }
      floats={
        <>
          <div className="absolute -left-6 bottom-10 hidden animate-float lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[160px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Business Score</p>
              <p className="mt-1.5 text-2xl font-black text-foreground">92 <span className="text-sm font-normal text-muted-foreground">/ 100</span></p>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div className="h-full w-[92%] rounded-full bg-[image:var(--gradient-brand)]" />
              </div>
            </div>
          </div>
        </>
      }
    >
      {/* KPI row */}
      <div className="mb-5 grid grid-cols-4 gap-2.5">
        {[
          { l: "Revenue", v: "₹8.4L", d: "+12%", tone: "text-emerald-600" },
          { l: "Profit", v: "₹2.1L", d: "+9%", tone: "text-emerald-600" },
          { l: "Expenses", v: "₹6.3L", d: "-3%", tone: "text-sky-600" },
          { l: "Orders", v: "2,148", d: "+7%", tone: "text-violet-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
            <p className="text-[10px] text-muted-foreground">{k.l}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{k.v}</p>
            <p className={`text-[10px] font-semibold mt-0.5 ${k.tone}`}>{k.d}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 mb-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Revenue trend</p>
            <p className="text-[11px] text-muted-foreground">Last 12 months</p>
          </div>
          <div className="flex gap-1">
            {["1M", "3M", "6M", "1Y"].map((t, i) => (
              <span key={t} className={`rounded-full px-2.5 py-1 text-[10px] cursor-pointer transition-colors ${i === 3 ? "bg-[color:var(--brand-electric)] text-white font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
          <defs>
            <linearGradient id="rptArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.22 258)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="oklch(0.62 0.22 258)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#rptArea)" />
          <path d={path} fill="none" stroke="oklch(0.55 0.24 258)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Top products mini row */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground shrink-0">Top products:</p>
        {["Amul Gold 1L", "Colgate MaxF.", "Maggi 70g"].map((p, i) => (
          <span key={p} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground">
            {i + 1}. {p}
          </span>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FINANCE PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function FinanceMockup() {
  return (
    <LargePreviewShell
      url="finance / cash-flow"
      badge={
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
          Reconciled ✓
        </span>
      }
      floats={
        <>
          <div className="absolute -right-6 top-20 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[165px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">30-day Forecast</p>
              <p className="mt-1.5 text-xl font-black text-foreground">₹9.2L</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ Positive cashflow</p>
            </div>
          </div>
        </>
      }
    >
      {/* P&L summary */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { l: "Total Income", v: "₹8,42,910", bar: 100, tone: "bg-emerald-400", textTone: "text-emerald-600" },
          { l: "Total Expenses", v: "₹4,71,220", bar: 56, tone: "bg-red-400", textTone: "text-red-500" },
          { l: "Net Profit", v: "₹3,71,690", bar: 44, tone: "bg-[color:var(--brand-electric)]", textTone: "text-[color:var(--brand-electric)]" },
          { l: "GST Liability", v: "₹92,210", bar: 11, tone: "bg-amber-400", textTone: "text-amber-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
            <p className="text-[10px] text-muted-foreground">{k.l}</p>
            <p className={`mt-1 text-sm font-bold ${k.textTone}`}>{k.v}</p>
            <div className="mt-2 h-1 w-full rounded-full bg-border">
              <div className={`h-full rounded-full ${k.tone}`} style={{ width: `${k.bar}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bank reconciliation */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Bank Reconciliation</p>
            <p className="text-[11px] text-muted-foreground">HDFC · October 2025</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">94% matched</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary">
          <div className="h-full w-[94%] rounded-full bg-[image:var(--gradient-brand)]" />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>1,842 transactions matched</span>
          <span className="text-amber-600 font-semibold">12 need review</span>
        </div>
      </div>

      {/* Expense categories */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { cat: "COGS", amt: "₹2.8L" },
          { cat: "Staff", amt: "₹92K" },
          { cat: "Rent", amt: "₹45K" },
          { cat: "Utilities", amt: "₹18K" },
        ].map((e) => (
          <div key={e.cat} className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px]">
            <span className="font-medium text-foreground">{e.cat}</span>
            <span className="text-muted-foreground">{e.amt}</span>
          </div>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MULTI-BRANCH PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function MultiBranchMockup() {
  const branches = [
    { name: "Bengaluru HQ", city: "Karnataka", rev: "₹3.2L", delta: "+14%", health: 96, status: "Excellent" },
    { name: "Mumbai · Andheri", city: "Maharashtra", rev: "₹2.1L", delta: "+9%", health: 88, status: "Good" },
    { name: "Delhi · Karol Bagh", city: "Delhi", rev: "₹1.6L", delta: "+4%", health: 74, status: "Monitor" },
    { name: "Chennai · T. Nagar", city: "Tamil Nadu", rev: "₹1.5L", delta: "+11%", health: 91, status: "Good" },
  ];
  return (
    <LargePreviewShell
      url="branches / overview"
      badge={
        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-600">
          4 branches · Central view
        </span>
      }
      floats={
        <>
          <div className="absolute -right-6 bottom-14 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[165px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Combined Revenue</p>
              <p className="mt-1.5 text-xl font-black text-foreground">₹8.4L</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ 9.5% MTD</p>
            </div>
          </div>
        </>
      }
    >
      {/* Summary row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { l: "Total Revenue", v: "₹8.4L" },
          { l: "Active Users", v: "28" },
          { l: "Stock Transfers", v: "14" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
            <p className="text-[10px] text-muted-foreground">{k.l}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Branch list */}
      <div className="space-y-2">
        {branches.map((b) => (
          <div key={b.name} className="flex items-center gap-4 rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/60 cursor-pointer">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-border bg-background">
              <Building2 className="h-4 w-4 text-[color:var(--brand-deep)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{b.name}</p>
              <p className="text-[11px] text-muted-foreground">{b.city}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{b.rev}</p>
                <p className="text-[10px] font-semibold text-emerald-600">{b.delta}</p>
              </div>
              <div>
                <div className="h-1 w-20 rounded-full bg-border">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${b.health}%` }} />
                </div>
                <p className={`text-[10px] mt-0.5 font-semibold ${b.status === "Excellent" || b.status === "Good" ? "text-emerald-600" : "text-amber-600"}`}>{b.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><Key className="h-3 w-3" /> Role-based access · Central billing</span>
        <span className="text-emerald-600 font-semibold">All systems active</span>
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CUSTOMERS MOCKUP (tab)
───────────────────────────────────────────────────────────────── */

function CustomersMockup() {
  const segments = [
    { label: "VIP", count: 284, pct: 5, color: "bg-[image:var(--gradient-brand)]", text: "text-white" },
    { label: "Loyal", count: 1142, pct: 20, color: "bg-sky-500", text: "text-white" },
    { label: "Regular", count: 2880, pct: 50, color: "bg-secondary border border-border", text: "text-foreground" },
    { label: "New", count: 1096, pct: 19, color: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700" },
    { label: "Churned", count: 419, pct: 7, color: "bg-red-50 border border-red-200", text: "text-red-600" },
  ];
  const topCustomers = [
    { name: "Meridian Retail", ltv: "₹1.42L", orders: 48, active: true, initials: "MR", last: "2h ago" },
    { name: "Vertex Trade", ltv: "₹2.18L", orders: 72, active: true, initials: "VT", last: "1h ago" },
    { name: "Cascade Foods", ltv: "₹98,400", orders: 34, active: false, initials: "CF", last: "1d ago" },
    { name: "Halcyon Group", ltv: "₹32,100", orders: 8, active: false, initials: "HG", last: "3d ago" },
  ];
  return (
    <LargePreviewShell
      url="crm / customer-analytics"
      badge={
        <span className="rounded-full bg-[color:var(--brand-electric)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-electric)]">
          5,821 customers
        </span>
      }
      floats={
        <>
          <div className="absolute -right-6 top-14 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[170px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg LTV</p>
              <p className="mt-1.5 text-xl font-black text-foreground">₹18,420</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ 14% this quarter</p>
            </div>
          </div>
          <div className="absolute -left-6 bottom-10 hidden animate-float lg:block">
            <div className="glass rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold text-foreground">Loyalty active</p>
              </div>
              <p className="text-xs text-muted-foreground">284 VIP customers enrolled</p>
            </div>
          </div>
        </>
      }
    >
      {/* Segment grid */}
      <div className="mb-4 grid grid-cols-5 gap-2">
        {segments.map((s) => (
          <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.color}`}>
            <p className={`text-base font-black ${s.text}`}>{s.count > 999 ? `${(s.count / 1000).toFixed(1)}k` : s.count}</p>
            <p className={`text-[10px] font-semibold mt-0.5 ${s.text} opacity-80`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* LTV bar chart */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Customer LTV distribution</p>
            <p className="text-[11px] text-muted-foreground">Revenue by segment · last 12 months</p>
          </div>
          <span className="text-[10px] font-semibold text-[color:var(--brand-electric)]">View all →</span>
        </div>
        <div className="space-y-2.5">
          {[
            { seg: "VIP", rev: "₹4.03L", pct: 100, color: "bg-[image:var(--gradient-brand)]" },
            { seg: "Loyal", rev: "₹1.82L", pct: 45, color: "bg-sky-400" },
            { seg: "Regular", rev: "₹2.88L", pct: 71, color: "bg-slate-300" },
          ].map((r) => (
            <div key={r.seg} className="flex items-center gap-3">
              <span className="w-12 text-[10px] font-medium text-muted-foreground">{r.seg}</span>
              <div className="flex-1 h-2 rounded-full bg-border">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
              <span className="w-14 text-right text-[11px] font-semibold text-foreground">{r.rev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top customers */}
      <div className="space-y-1.5">
        {topCustomers.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/30 px-3 py-2 hover:bg-secondary/60 cursor-pointer transition-colors">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-[11px] font-bold text-white">
              {c.initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.orders} orders · {c.last}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-foreground">{c.ltv}</p>
              <span className={`text-[9px] font-semibold ${c.active ? "text-emerald-600" : "text-muted-foreground"}`}>
                {c.active ? "● Active" : "○ Dormant"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI MOCKUP (tab panel version — lighter)
───────────────────────────────────────────────────────────────── */

function AIMockupTab() {
  const msgs = [
    { role: "user" as const, text: "How did sales perform today?" },
    { role: "ai" as const, text: "You've done ₹64,320 across 87 invoices — up 12% vs yesterday. Best seller: Amul Gold 1L (42 units). Meridian Retail accounts for 28% of today's revenue.", action: undefined },
    { role: "user" as const, text: "Create an invoice for Priya Traders, 3 usual items." },
    { role: "ai" as const, text: "Drafted INV-1042 for Priya Traders with their 3 most frequent items. GST auto-calculated (₹3,780). Shall I send to their email or print?", action: "Preview Invoice" },
    { role: "user" as const, text: "Which products need restocking this week?" },
    { role: "ai" as const, text: "3 items below reorder threshold: Tata Salt 1kg (4 left), Colgate MaxFresh (6 left), Maggi 70g (9 left). Shall I create purchase orders?", action: "Create POs" },
  ];
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-brand)] opacity-[0.10] blur-3xl" />

      {/* Browser chrome */}
      <div className="overflow-hidden rounded-2xl border border-border bg-[color:var(--brand-deep)] shadow-[0_24px_80px_-20px_oklch(0.14_0.02_260/0.30),0_0_0_1px_oklch(0.14_0.02_260/0.08)]">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
          <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-white/8 px-3 py-1.5">
            <span className="text-[11px] text-white/40">nexora.app /</span>
            <span className="text-[11px] font-medium text-white/70">ai-assistant</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Nexora AI</p>
            <p className="text-[10px] text-white/45">Trained on your full business data</p>
          </div>
        </div>

        {/* Messages */}
        <div className="max-h-[340px] overflow-y-auto p-5 space-y-3 scrollbar-hide">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[88%] space-y-2">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-white text-[color:var(--brand-deep)] font-medium"
                    : "bg-white/10 text-white"
                }`}>
                  {m.text}
                </div>
                {m.action && (
                  <button className="flex items-center gap-1.5 rounded-full border border-[color:var(--brand-electric)]/40 bg-[color:var(--brand-electric)]/15 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--brand-glow)]">
                    <Check className="h-3 w-3" /> {m.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3">
            <Sparkles className="h-4 w-4 text-white/40 flex-shrink-0" />
            <span className="flex-1 text-sm text-white/35">Ask Nexora anything about your business…</span>
            <button className="grid h-7 w-7 place-items-center rounded-full bg-[image:var(--gradient-brand)] flex-shrink-0">
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -right-6 top-16 hidden animate-float-slower lg:block">
        <div className="glass rounded-2xl px-4 py-3.5 shadow-lg min-w-[165px]">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Actions Today</p>
          <p className="mt-1.5 text-xl font-black text-foreground">142</p>
          <p className="text-[11px] text-muted-foreground">invoices · POs · reports</p>
        </div>
      </div>
      <div className="absolute -left-6 bottom-16 hidden animate-float lg:block">
        <div className="glass rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[image:var(--gradient-brand)]">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            <p className="text-xs font-semibold text-foreground">Invoice drafted in 3s</p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">INV-1042 · Priya Traders · ₹24,780</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PRODUCT SHOWCASE — premium tabbed interactive section
───────────────────────────────────────────────────────────────── */

interface ShowcaseTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  headline: string;
  description: string;
  items: string[];
  badges: string[];
  metrics: { label: string; value: string; sub?: string }[];
  mockup: ReactNode;
  reverse?: boolean;
  accentClass?: string;
}

function Features() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: ShowcaseTab[] = [
    {
      id: "billing",
      label: "Billing",
      icon: Receipt,
      eyebrow: "Billing & Invoicing",
      headline: "Billing that works as fast as your business.",
      description: "Create GST-compliant invoices, quotations, purchase bills and recurring invoices from one intelligent workspace. UPI QR, thermal printing and auto payment reminders included.",
      items: ["GST Invoices & Quotations", "Purchase Bills & Credit Notes", "Recurring Invoices", "Multiple Invoice Templates", "UPI Payment QR", "Razorpay & PhonePe", "Auto Payment Reminders", "GSTR-1 Export"],
      badges: ["GST Certified", "Razorpay Ready", "UPI Payments", "Thermal Printing"],
      metrics: [
        { label: "Invoices today", value: "87", sub: "+12% vs yesterday" },
        { label: "Collected", value: "₹64,320", sub: "today" },
        { label: "Outstanding", value: "₹3.2L", sub: "12 invoices" },
      ],
      mockup: <BillingMockup />,
      reverse: false,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Boxes,
      eyebrow: "Inventory Management",
      headline: "Every product, every unit, always accurate.",
      description: "Real-time stock updates with every sale and purchase. Batch tracking, expiry alerts, barcode scanning and AI-powered restock suggestions keep shelves full and cash flowing.",
      items: ["Unlimited Products & Categories", "Barcode Generation & Scanner", "Batch & Expiry Tracking", "Low Stock Alerts", "Purchase Orders & Suppliers", "Multi-location Inventory", "Stock Transfer", "Auto Restock Suggestions"],
      badges: ["Barcode Ready", "Multi-Warehouse", "Real-time Sync", "AI Reorder"],
      metrics: [
        { label: "Total SKUs", value: "1,284", sub: "3 warehouses" },
        { label: "Low stock", value: "3", sub: "need reorder" },
        { label: "Value tracked", value: "₹12.4L", sub: "at cost" },
      ],
      mockup: <InventoryMockup />,
      reverse: true,
      accentClass: "bg-sky-500/10 text-sky-600",
    },
    {
      id: "crm",
      label: "CRM",
      icon: Users,
      eyebrow: "CRM & Relationships",
      headline: "Every customer relationship, in one place.",
      description: "Complete customer profiles with full purchase history, outstanding dues, loyalty points and sales pipeline status. Follow-ups and reminders run automatically so nothing slips.",
      items: ["Customer Database & 360° View", "Full Purchase History", "Sales Pipeline & Leads", "Follow-up Reminders", "Customer Segmentation", "Loyalty Program", "Outstanding Tracking", "Customer Analytics"],
      badges: ["360° Customer View", "Pipeline Tracking", "Auto Follow-ups", "Loyalty Points"],
      metrics: [
        { label: "Total customers", value: "5,821", sub: "active buyers" },
        { label: "Active deals", value: "12", sub: "in pipeline" },
        { label: "Won MTD", value: "₹6.2L", sub: "+24% vs last month" },
      ],
      mockup: <CRMMockup />,
      reverse: false,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      eyebrow: "Reports & Analytics",
      headline: "Every number, live. Every insight, instant.",
      description: "Live P&L, revenue trends, business health score, tax summaries and employee performance — always current, always precise. Monthly close drops from weeks to hours.",
      items: ["Daily & Monthly Sales Reports", "Profit & Loss Statement", "Revenue Analytics", "Best & Slow-Moving Products", "Employee Performance", "Tax Reports & GST Summary", "Business Health Score", "Export to PDF & Excel"],
      badges: ["Live Dashboard", "GST Summary", "P&L Reports", "Excel Export"],
      metrics: [
        { label: "Revenue MTD", value: "₹8.4L", sub: "+12% vs last month" },
        { label: "Net profit", value: "₹2.1L", sub: "25% margin" },
        { label: "Business score", value: "92/100", sub: "Excellent" },
      ],
      mockup: <ReportsMockup />,
      reverse: true,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      id: "finance",
      label: "Finance",
      icon: Wallet,
      eyebrow: "Finance & Cash Flow",
      headline: "Full financial clarity, zero surprises.",
      description: "Track every rupee in and out. Cash flow forecasting, expense management, bank reconciliation and tax summary in one cockpit. Know your position 30 days ahead.",
      items: ["Expense Management", "Income Tracking", "Cash Flow Dashboard", "30-Day Forecast", "Profit Tracking", "Tax Summary", "Bank Reconciliation", "Financial Dashboard"],
      badges: ["Bank Reconciliation", "30-day Forecast", "Tax Summary", "Auto-Categorise"],
      metrics: [
        { label: "30-day forecast", value: "₹9.2L", sub: "positive cashflow" },
        { label: "Reconciled", value: "94%", sub: "1,842 transactions" },
        { label: "GST liability", value: "₹92,210", sub: "due 11 Nov" },
      ],
      mockup: <FinanceMockup />,
      reverse: false,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "ai",
      label: "AI Assistant",
      icon: Sparkles,
      eyebrow: "Nexora AI",
      headline: "An operator who never sleeps, inside your business.",
      description: "Ask in plain English or Hindi. Nexora AI understands your full business context — sales, inventory, customers, cash flow — and takes real actions, not just answers.",
      items: ["Plain-language business Q&A", "Auto-draft invoices & reports", "Stock & cash flow alerts", "Sales forecasting", "Inventory forecasting", "Natural language search", "Multi-language (English + Hindi)", "Learns from your business patterns"],
      badges: ["GPT-4 Powered", "Business-context AI", "Action-not-just-answers", "Hindi + English"],
      metrics: [
        { label: "AI actions today", value: "142", sub: "invoices · POs · alerts" },
        { label: "Time saved", value: "4.2h", sub: "per day avg" },
        { label: "Accuracy", value: "99.1%", sub: "GST calculations" },
      ],
      mockup: <AIMockupTab />,
      reverse: true,
      accentClass: "bg-[color:var(--brand-electric)]/10 text-[color:var(--brand-electric)]",
    },
    {
      id: "customers",
      label: "Customers",
      icon: UserCog,
      eyebrow: "Customer Intelligence",
      headline: "Know every customer. Grow every relationship.",
      description: "Deep customer analytics across segments — VIP, loyal, new, churned. LTV tracking, churn prediction, loyalty rewards and automated re-engagement campaigns built in.",
      items: ["Customer Segmentation (5 tiers)", "Lifetime Value Tracking", "Churn Risk Prediction", "Loyalty & Rewards Programme", "Automated Re-engagement", "Purchase Frequency Analysis", "Top Customer Leaderboard", "WhatsApp & SMS Campaigns"],
      badges: ["LTV Analytics", "Churn Prediction", "Loyalty Rewards", "Auto Campaigns"],
      metrics: [
        { label: "VIP customers", value: "284", sub: "5% of base" },
        { label: "Avg LTV", value: "₹18,420", sub: "+14% this quarter" },
        { label: "Retention", value: "87%", sub: "12-month rate" },
      ],
      mockup: <CustomersMockup />,
      reverse: false,
      accentClass: "bg-[color:var(--brand-electric)]/10 text-[color:var(--brand-electric)]",
    },
    {
      id: "branches",
      label: "Multi-Branch",
      icon: Building2,
      eyebrow: "Multi-Branch Management",
      headline: "Run every location from one command centre.",
      description: "Unlimited branches, centralised reporting and branch-wise inventory — all visible from a single login. Role-based access ensures the right people see the right data.",
      items: ["Unlimited Branch Management", "Centralised Dashboard", "Branch Performance Comparison", "Branch-wise Inventory", "Branch-wise Reports", "Central Billing", "Role-Based Access", "Stock Transfer Between Branches"],
      badges: ["Unlimited Branches", "Central Billing", "Role-Based Access", "Stock Transfer"],
      metrics: [
        { label: "Active branches", value: "4", sub: "across 4 states" },
        { label: "Combined revenue", value: "₹8.4L", sub: "+9.5% MTD" },
        { label: "Stock transfers", value: "14", sub: "this month" },
      ],
      mockup: <MultiBranchMockup />,
      reverse: true,
      accentClass: "bg-sky-500/10 text-sky-600",
    },
  ];

  const tab = tabs[activeTab];

  return (
    <section id="features" className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.62_0.22_258/0.06),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-10">
          <SectionLabel>Product</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything your business needs,{" "}
            <span className="text-[color:var(--brand-electric)]">built in.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
            Click a module to explore it. One platform — billing, inventory, CRM, finance, AI and more.
          </p>
        </div>

        {/* Tab navigation — scrollable on mobile */}
        <div className="flex justify-center mb-12">
          <div className="overflow-x-auto scrollbar-hide max-w-full">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1.5 backdrop-blur">
              {tabs.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    activeTab === i
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeTab === i && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_6px_oklch(0.14_0.02_260/0.12)]"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.38 }}
                    />
                  )}
                  <t.icon className="relative z-10 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Metrics bar */}
            <div className="mb-10 grid grid-cols-3 gap-4 lg:gap-6">
              {tab.metrics.map((m) => (
                <div key={m.label} className="rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <p className="mt-1.5 text-2xl font-black text-foreground leading-none">{m.value}</p>
                  {m.sub && <p className="mt-1 text-[11px] text-muted-foreground">{m.sub}</p>}
                </div>
              ))}
            </div>

            {/* Main 2-col layout */}
            <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] ${tab.reverse ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
              {/* Mockup */}
              <div className={`relative ${tab.reverse ? "lg:order-2" : "lg:order-1"}`}>
                {tab.mockup}
              </div>

              {/* Copy */}
              <div className={`${tab.reverse ? "lg:order-1 lg:pr-6" : "lg:order-2 lg:pl-6"}`}>
                <SectionLabel>{tab.eyebrow}</SectionLabel>
                <h3 className="mt-4 text-2xl font-black leading-[1.15] tracking-tight text-foreground sm:text-3xl lg:text-[2.1rem]">
                  {tab.headline}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  {tab.description}
                </p>

                {/* Feature checklist */}
                <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {tab.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[color:var(--brand-electric)]/10">
                        <Check className="h-3 w-3 text-[color:var(--brand-electric)]" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Trust badges */}
                <div className="mt-7 flex flex-wrap gap-2">
                  {tab.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-[0_1px_4px_oklch(0.14_0.02_260/0.08)]"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[color:var(--brand-electric)]" />
                      {b}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-7">
                  <a
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-electric)] transition-all duration-200 hover:gap-3"
                  >
                    Start with {tab.label} free
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Solutions() {
  const solutions = [
    {
      segment: "RETAIL & STORES",
      title: "Serve every customer, keep every shelf ready.",
      description: "Bring billing, inventory, and customer context into one daily workflow—at the counter and beyond.",
      icon: ShoppingCart,
      points: ["Faster checkout and GST billing", "Stock alerts and purchase planning", "Customer history at a glance"],
      accent: "from-blue-500 to-cyan-400",
      iconTone: "bg-blue-50 text-blue-600",
    },
    {
      segment: "DISTRIBUTION & WHOLESALE",
      title: "Coordinate orders, stock, and collections.",
      description: "Keep product availability, business buyers, invoices, and outstanding balances connected.",
      icon: Warehouse,
      points: ["Manage products and suppliers", "Track invoices and payments", "Review sales and stock trends"],
      accent: "from-violet-500 to-indigo-400",
      iconTone: "bg-violet-50 text-violet-600",
    },
    {
      segment: "GROWING MULTI-LOCATION TEAMS",
      title: "See the whole business from one place.",
      description: "Give teams a shared operating picture with business records, reporting, and access in one platform.",
      icon: GitBranch,
      points: ["Bring branch activity together", "Follow role-based access", "Compare business performance"],
      accent: "from-emerald-500 to-teal-400",
      iconTone: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section id="solutions" className="relative overflow-hidden bg-[color:var(--brand-deep)] py-20 text-white sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_0%_0%,oklch(0.62_0.22_258/0.24),transparent_65%),radial-gradient(700px_420px_at_100%_100%,oklch(0.72_0.19_250/0.17),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-glow)]"><span className="h-px w-5 bg-[color:var(--brand-glow)]/60" />Built around your business</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">One platform. <span className="text-[color:var(--brand-glow)]">Your way of working.</span></h2><p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">Solutions for the teams that keep commerce moving—from the first invoice to the next location.</p></div>
          <a href="/signup" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10">Find your fit <ArrowRight className="h-4 w-4" /></a>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {solutions.map((solution) => (
            <article key={solution.segment} className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] sm:p-7">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${solution.accent}`} />
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${solution.iconTone}`}><solution.icon className="h-5 w-5" /></span>
              <p className="mt-6 text-[10px] font-bold tracking-[0.17em] text-white/40">{solution.segment}</p>
              <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-white">{solution.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{solution.description}</p>
              <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4">{solution.points.map((point) => <li key={point} className="flex items-center gap-2.5 text-xs text-white/75"><Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-glow)]" />{point}</li>)}</ul>
              <a href="/signup" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-semibold text-[color:var(--brand-glow)] transition-all hover:gap-2.5">Explore Nexora <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI SHOWCASE
───────────────────────────────────────────────────────────────── */

const CHAT_MESSAGES: { role: "user" | "ai"; text: string; action?: string }[] = [
  { role: "user", text: "How did sales perform today?" },
  { role: "ai", text: "You've done ₹64,320 across 87 invoices — up 12% vs yesterday. Best seller: Amul Gold 1L (42 units). One customer, Meridian Retail, accounts for 28% of today's revenue." },
  { role: "user", text: "Create an invoice for Priya Traders, 3 usual items." },
  { role: "ai", text: "Drafted INV-1042 for Priya Traders with their 3 most frequent items. GST auto-calculated (₹3,780). Shall I send to their registered email or print?", action: "Preview Invoice" },
  { role: "user", text: "Which products need restocking this week?" },
  { role: "ai", text: "3 items below reorder threshold: Tata Salt 1kg (4 left · reorder 200), Colgate MaxFresh (6 left · reorder 50), Maggi 70g (9 left · reorder 100). Shall I create purchase orders?", action: "Create POs" },
  { role: "user", text: "What's my GST liability for October?" },
  { role: "ai", text: "Output GST: ₹1,84,320 · Input Credit: ₹92,110 · Net payable: ₹92,210. GSTR-1 ready for filing. Due date: 11 November." },
];

function AIShowcase() {
  return (
    <section id="ai" className="relative overflow-hidden bg-[color:var(--brand-deep)] py-24 text-white lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_0%,oklch(0.62_0.22_258/0.4),transparent_55%),radial-gradient(700px_400px_at_100%_100%,oklch(0.72_0.19_250/0.28),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-glow)]">
            Nexora AI
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            An operator who never sleeps,{" "}
            <span className="text-[color:var(--brand-glow)]">inside your business.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65">
            Ask in plain English or Hindi. Nexora AI understands your full business context — sales, inventory, customers, cash flow — and takes real actions, not just answers.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: Brain, title: "Answers business questions in seconds", desc: "Revenue, profit, top customers, tax liability — ask anything, get precise answers instantly." },
              { icon: FileText, title: "Drafts invoices, reports and reminders for you", desc: "Say 'create an invoice for Priya Traders' and it's done. With correct GST, in 3 seconds." },
              { icon: Bell, title: "Catches problems before they cost you", desc: "Detects stock issues, overdue invoices, cash flow risks and anomalies before they escalate." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/10">
                  <item.icon className="h-5 w-5 text-[color:var(--brand-glow)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-white/55">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Btn href="/signup" variant="white" size="lg">
              Try Nexora AI Free <ArrowRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>

        {/* Right: chat UI */}
        <div className="glass-dark rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold">Nexora AI</p>
                <p className="text-[10px] text-white/45">Trained on your business data</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-5 space-y-3 scrollbar-hide">
            {CHAT_MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%] space-y-2">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white text-[color:var(--brand-deep)] font-medium"
                      : "bg-white/10 text-white"
                  }`}>
                    {m.text}
                  </div>
                  {m.action && (
                    <button className="flex items-center gap-1.5 rounded-full border border-[color:var(--brand-electric)]/40 bg-[color:var(--brand-electric)]/15 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--brand-glow)] transition-colors hover:bg-[color:var(--brand-electric)]/25">
                      <Check className="h-3 w-3" /> {m.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3">
              <Sparkles className="h-4 w-4 text-white/40 flex-shrink-0" />
              <input
                disabled
                placeholder="Ask Nexora anything about your business…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
              <button className="grid h-7 w-7 place-items-center rounded-full bg-[image:var(--gradient-brand)] flex-shrink-0">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI AGENTS
───────────────────────────────────────────────────────────────── */

function AIAgents() {
  const agents = [
    { name: "AI Sales Agent", category: "REVENUE", description: "Surface sales opportunities, prepare lead follow-ups, and make sense of customer inquiries.", icon: TrendingUp, tint: "bg-blue-50 text-blue-600" },
    { name: "AI Billing Agent", category: "BILLING", description: "Create invoice drafts, track payment status, and bring overdue balances into focus.", icon: Receipt, tint: "bg-violet-50 text-violet-600" },
    { name: "AI Inventory Agent", category: "OPERATIONS", description: "Review stock levels, spot products running low, and plan upcoming inventory needs.", icon: Boxes, tint: "bg-amber-50 text-amber-600" },
    { name: "AI Finance Agent", category: "FINANCE", description: "Summarize revenue, expenses, outstanding payments, and the trends behind them.", icon: Wallet, tint: "bg-emerald-50 text-emerald-600" },
    { name: "AI CRM Agent", category: "CUSTOMERS", description: "Bring customer history into view and identify timely opportunities to follow up.", icon: Users, tint: "bg-sky-50 text-sky-600" },
    { name: "AI Analytics Agent", category: "INSIGHTS", description: "Turn business performance into clear summaries, useful trends, and quick answers.", icon: LineChart, tint: "bg-indigo-50 text-indigo-600" },
    { name: "AI Support Agent", category: "CUSTOMER CARE", description: "Help respond to common customer questions and keep support requests organized.", icon: MessageCircle, tint: "bg-rose-50 text-rose-600" },
    { name: "AI Business Assistant", category: "YOUR COPILOT", description: "Ask questions across business operations through one unified conversational assistant.", icon: Sparkles, tint: "bg-cyan-50 text-cyan-700" },
  ];

  return (
    <section id="agents" className="relative overflow-hidden bg-secondary/35 py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-violet-100/50 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <SectionLabel>Specialized intelligence</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">Meet Your <span className="text-gradient">AI Workforce</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">Intelligent AI agents that automate tasks, connect your business, and help you grow.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent, index) => (
            <article key={agent.name} style={{ animationDelay: `${index * 50}ms` }} className="group animate-rise flex min-h-[246px] flex-col rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-electric)]/35 hover:shadow-[var(--shadow-elegant)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/[0.03] ${agent.tint}`}><agent.icon className="h-5 w-5" /></div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[9px] font-bold tracking-[0.13em] text-muted-foreground">{agent.category}</span>
              </div>
              <h3 className="mt-5 text-base font-bold tracking-tight text-foreground">{agent.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{agent.description}</p>
              <a href="/signup" className="mt-5 inline-flex w-fit items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-[color:var(--brand-electric)] transition-colors hover:text-[color:var(--brand-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-electric)]">
                Explore agent <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/80 p-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm"><Bot className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-foreground">One connected team for every part of your business</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Explore Nexora and see how intelligent workflows can fit the way your business works.</p></div></div>
          <Btn href="/signup" size="sm" className="shrink-0 rounded-xl">Explore Nexora <ArrowRight className="h-3.5 w-3.5" /></Btn>
        </div>
      </div>
    </section>
  );
}

function WorkflowTour() {
  const workflows = [
    {
      label: "Collect a payment",
      eyebrow: "BILLING WORKFLOW",
      title: "Keep cash flow moving.",
      description: "See what needs attention and prepare a timely customer follow-up from one clear view.",
      icon: Receipt,
      signal: "Invoice approaching due date",
      insight: "Cascade Foods · INV-2084 · ₹18,900",
      action: "Prepare a payment reminder",
      result: "Review the draft, then send when you’re ready",
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Replenish stock",
      eyebrow: "INVENTORY WORKFLOW",
      title: "Stay ahead of low stock.",
      description: "Spot products nearing their reorder point and turn a stock signal into a practical next step.",
      icon: Boxes,
      signal: "Product below reorder point",
      insight: "Tata Salt 1kg · 4 units on hand",
      action: "Review a purchase order draft",
      result: "Confirm quantities before placing an order",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Understand performance",
      eyebrow: "BUSINESS INSIGHT",
      title: "Make the numbers clearer.",
      description: "Bring key business signals together so you can understand what changed and decide what to do next.",
      icon: BarChart3,
      signal: "Monthly revenue trend",
      insight: "Revenue is up 12% compared with last month",
      action: "Explore the change by category",
      result: "Move from a summary to the underlying report",
      color: "text-blue-600 bg-blue-50",
    },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = workflows[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section id="workflow" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <SectionLabel>A clearer way to work</SectionLabel>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-[2.8rem] lg:leading-[1.08]">From business signal to your next best step.</h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">Explore a few sample Nexora workflows. Switch between them to see how billing, inventory, and business insights can come together.</p>
            <div className="mt-8 space-y-2" role="tablist" aria-label="Sample business workflows">
              {workflows.map((workflow, index) => {
                const Icon = workflow.icon;
                const isActive = index === activeIndex;
                return <button key={workflow.label} id={`workflow-tab-${index}`} type="button" role="tab" aria-selected={isActive} aria-controls="workflow-panel" onClick={() => setActiveIndex(index)} className={`group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ${isActive ? "border-indigo-200 bg-indigo-50/80 shadow-sm" : "border-transparent hover:border-border hover:bg-secondary/70"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${workflow.color}`}><Icon className="h-4.5 w-4.5" /></span>
                  <span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${isActive ? "text-indigo-950" : "text-foreground"}`}>{workflow.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{workflow.eyebrow.toLowerCase().replace(" workflow", "")}</span></span>
                  <ArrowRight className={`h-4 w-4 transition-transform ${isActive ? "translate-x-0 text-indigo-600" : "-translate-x-1 text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                </button>;
              })}
            </div>
          </div>

          <div id="workflow-panel" role="tabpanel" aria-labelledby={`workflow-tab-${activeIndex}`} className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_oklch(0.22_0.09_265/0.32)] sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${active.color}`}><ActiveIcon className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-900">Nexora workflow</p><p className="mt-0.5 text-[11px] text-slate-500">{active.eyebrow}</p></div></div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">Sample walkthrough</span>
            </div>
            <div className="py-6"><h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{active.title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{active.description}</p></div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm"><Bell className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business signal</p><p className="mt-1 text-sm font-semibold text-slate-800">{active.signal}</p><p className="mt-1 text-xs text-slate-500">{active.insight}</p></div></div>
              <div className="ml-7 h-5 border-l border-dashed border-indigo-200" />
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm"><Sparkles className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Nexora helps you</p><p className="mt-1 text-sm font-semibold text-indigo-950">{active.action}</p><p className="mt-1 text-xs text-indigo-700/70">{active.result}</p></div></div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-[11px] text-slate-400">Illustrative sample data</p><a href="/signup" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800">See Nexora in action <ArrowRight className="h-3.5 w-3.5" /></a></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD PREVIEW
───────────────────────────────────────────────────────────────── */

function DashboardPreview() {
  return (
    <section id="dashboard" className="landing-dashboard relative py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Command Centre</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            See every part of your business, in real time.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground lg:text-lg">
            One clean command centre for revenue, orders, customers, profit, inventory and outstanding payments — updated the moment a transaction happens.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-elegant)] sm:p-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              {[
                { icon: Wallet, label: "Revenue", value: "₹8,42,910", delta: "+12.3%", sub: "vs last month" },
                { icon: ShoppingCart, label: "Orders", value: "2,148", delta: "+6.8%", sub: "vs last month" },
                { icon: Users, label: "Customers", value: "5,821", delta: "+3.2%", sub: "active buyers" },
                { icon: TrendingUp, label: "Net Profit", value: "₹2,10,480", delta: "+9.1%", sub: "margin 25%" },
              ].map((k) => (
                <div key={k.label} className="bg-card px-6 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                    <k.icon className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{k.value}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-emerald-600">{k.delta}</span>
                    <span className="text-xs text-muted-foreground">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + pending */}
            <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
              <div className="col-span-2 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Revenue trend</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="flex gap-1 text-[11px]">
                    {["1W", "1M", "3M", "1Y"].map((r, i) => (
                      <span key={r} className={`rounded-full px-2.5 py-1 cursor-pointer transition-colors ${
                        i === 1 ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ChartArea />
              </div>
              <div className="bg-card p-6">
                <p className="text-sm font-semibold text-foreground">Outstanding payments</p>
                <p className="text-xs text-muted-foreground mt-0.5">12 invoices · ₹3,24,110</p>
                <div className="mt-5 space-y-4">
                  {[
                    { name: "Meridian Traders", amt: "₹42,300", status: "Due in 2 days", urgent: false },
                    { name: "Cascade Foods", amt: "₹18,900", status: "Due tomorrow", urgent: true },
                    { name: "Halcyon Retail", amt: "₹1,20,000", status: "Overdue 3 days", urgent: true },
                    { name: "Vertex Wholesale", amt: "₹24,600", status: "Due in 5 days", urgent: false },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className={`text-[11px] font-medium ${p.urgent ? "text-red-500" : "text-muted-foreground"}`}>
                          {p.status}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{p.amt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartArea() {
  const points = [10, 22, 18, 30, 26, 40, 34, 48, 42, 58, 52, 64, 60, 72, 68, 82, 78, 90, 84, 95];
  const max = 100;
  const w = 640;
  const h = 180;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full">
      <defs>
        <linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.22 258)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="oklch(0.62 0.22 258)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartArea)" />
      <path d={path} fill="none" stroke="oklch(0.55 0.24 258)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INTEGRATIONS
───────────────────────────────────────────────────────────────── */

const INTEGRATIONS_LIVE = [
  {
    name: "UPI Payments",
    category: "Payments",
    desc: "QR code on every invoice. Customers scan and pay instantly — no gateway fees.",
    icon: QrCode,
    color: "bg-orange-50 border-orange-100 text-orange-600",
  },
  {
    name: "Razorpay",
    category: "Payments",
    desc: "Accept cards, net banking, wallets and EMI. Payments reconciled automatically.",
    icon: CreditCard,
    color: "bg-blue-50 border-blue-100 text-blue-600",
  },
  {
    name: "Excel & CSV",
    category: "Data",
    desc: "Bulk-import products, customers and opening stock. Export any report instantly.",
    icon: FileText,
    color: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
  {
    name: "Barcode Scanner",
    category: "Hardware",
    desc: "USB and webcam barcode scanning built directly into inventory and billing.",
    icon: Scan,
    color: "bg-slate-50 border-slate-200 text-slate-600",
  },
  {
    name: "Thermal Printer",
    category: "Hardware",
    desc: "Print 58mm and 80mm POS receipts from any page, with one click.",
    icon: Printer,
    color: "bg-slate-50 border-slate-200 text-slate-600",
  },
  {
    name: "Email (SMTP)",
    category: "Email",
    desc: "Send invoices, payment reminders and statements directly from Nexora.",
    icon: Mail,
    color: "bg-red-50 border-red-100 text-red-600",
  },
];

const INTEGRATIONS_SOON = [
  { name: "WhatsApp Business", category: "Messaging", desc: "Auto-send invoices and payment reminders on WhatsApp.", quarter: "Q3 2026" },
  { name: "PhonePe", category: "Payments", desc: "Accept PhonePe merchant gateway payments seamlessly.", quarter: "Q3 2026" },
  { name: "Tally Export", category: "Accounting", desc: "Two-way sync with Tally ERP for zero-effort bookkeeping.", quarter: "Q4 2026" },
  { name: "Google Sheets", category: "Data", desc: "Live-sync your reports and business data to Sheets.", quarter: "Q4 2026" },
  { name: "Stripe", category: "Payments", desc: "Accept international cards, subscriptions and checkout.", quarter: "Q1 2027" },
  { name: "Developer API", category: "Platform", desc: "REST API and webhooks to build custom integrations.", quarter: "Q1 2027" },
  { name: "Google Workspace", category: "Productivity", desc: "Single sign-on and Drive integration for document storage.", quarter: "Q2 2027" },
  { name: "Microsoft 365", category: "Productivity", desc: "Outlook email dispatch and OneDrive backup support.", quarter: "Q2 2027" },
];

function Integrations() {
  return (
    <section id="integrations" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Integrations</SectionLabel>
          <h2 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            Honest about what connects today.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            We only show integrations that are actually built and working. Everything else is clearly marked with its planned release date.
          </p>
        </div>

        {/* ── Available Today ── */}
        <div className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-emerald-600 uppercase tracking-[0.15em]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Available in Nexora v1.0
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS_LIVE.map((int) => (
              <div
                key={int.name}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand-electric)]/30 hover:shadow-[0_8px_30px_oklch(0.14_0.02_260/0.10)]"
              >
                <span className={`mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border ${int.color}`}>
                  <int.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{int.name}</p>
                  <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-0.5">{int.category}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{int.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coming Soon ── */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-amber-600 uppercase tracking-[0.15em]">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Coming soon — not available today
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {INTEGRATIONS_SOON.map((int) => (
              <div
                key={int.name}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-4 opacity-75 transition-opacity hover:opacity-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground/70">{int.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-0.5">{int.category}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wider">
                    {int.quarter}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground/60">{int.desc}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50">
                  <Clock3 className="h-3 w-3" /> Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Don't see what you need?{" "}
          <a href="#contact" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Request an integration →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SECURITY & TRUST
───────────────────────────────────────────────────────────────── */

function Security() {
  const pillars = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      desc: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your business data is never readable by anyone but you.",
    },
    {
      icon: Cloud,
      title: "Automatic Cloud Backup",
      desc: "Daily automated backups with 30-day point-in-time restore. Business continuity guaranteed even in disaster scenarios.",
    },
    {
      icon: Key,
      title: "Role-Based Access Control",
      desc: "Define exactly what each employee can see and do. Cashiers, managers, accountants — each with the right access level.",
    },
    {
      icon: FileText,
      title: "Complete Audit Logs",
      desc: "Every action, change and login is logged with user, time and IP. Full accountability across your entire team.",
    },
    {
      icon: Shield,
      title: "99.9% Uptime SLA",
      desc: "Hosted on enterprise-grade cloud infrastructure with automatic failover. Your business never stops because Nexora does.",
    },
    {
      icon: Globe,
      title: "GST Compliance Built In",
      desc: "Stays current with every GST notification. GSTR-1 export, e-invoice, and e-way bills handled automatically.",
    },
  ];
  return (
    <section id="security" className="py-24 lg:py-32 bg-[color:var(--brand-deep)] text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-glow)]">Enterprise Trust</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Enterprise-grade security,{" "}
            <span className="text-[color:var(--brand-glow)]">SMB-friendly pricing.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            The same security standards used by Fortune 500 companies — available to every business on Nexora from day one.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur transition-all duration-300 hover:bg-white/10 hover:border-[color:var(--brand-glow)]/30"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[color:var(--brand-glow)] transition-colors group-hover:bg-[image:var(--gradient-brand)]">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6">
          {[
            "AES-256 Encryption", "TLS 1.3 in Transit", "Daily Backups",
            "RBAC Access Control", "GST Compliant", "99.9% SLA",
          ].map((badge) => (
            <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-glow)]" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const principles = [
    { icon: Layers, title: "One connected workspace", description: "Billing, inventory, customer relationships, and finance sit together in one business operating system." },
    { icon: Brain, title: "Clarity for everyday decisions", description: "Useful summaries and intelligent assistance help make business information easier to understand." },
    { icon: ShieldCheck, title: "Tools that respect your team", description: "Role-based access and clear business context help teams work with the information they need." },
  ];

  return (
    <section id="about" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-40 top-12 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div>
          <SectionLabel>About Nexora</SectionLabel>
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">Built to make running a business feel more connected.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Nexora brings the details of running a business into one place, so teams can spend less time switching tools and more time moving work forward.</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">From the first customer conversation to the latest payment or stock update, Nexora is designed to give business owners a clearer view of what is happening and what needs attention.</p>
          <a href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition hover:-translate-y-0.5">Discover Nexora <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="relative rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 p-5 shadow-[0_24px_70px_-42px_oklch(0.32_0.16_262/0.32)] sm:p-7">
          <div className="absolute right-7 top-7 h-20 w-20 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="relative mb-5 flex items-center gap-3 border-b border-indigo-100/80 pb-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-brand)] shadow-md"><Sparkles className="h-5 w-5 text-white" /></span><div><p className="text-sm font-bold text-foreground">The Nexora approach</p><p className="mt-0.5 text-xs text-muted-foreground">Less fragmentation. More momentum.</p></div></div>
          <div className="relative space-y-2">{principles.map((principle, index) => <div key={principle.title} className="flex gap-4 rounded-2xl p-3 transition hover:bg-white/80 sm:p-4"><span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm"><principle.icon className="h-4.5 w-4.5" /></span><div><div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-widest text-indigo-400">0{index + 1}</span><h3 className="text-sm font-semibold text-foreground">{principle.title}</h3></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{principle.description}</p></div></div>)}</div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    quote: "We replaced four different tools with Nexora. Monthly closing dropped from 2 weeks to 2 days. The AI catches things I'd miss on my busiest days.",
    name: "Priya Sharma",
    role: "Founder",
    company: "Meridian Retail, Bengaluru",
    revenue: "₹2.4 Cr annual revenue",
  },
  {
    quote: "The AI flagged a stock issue on a Friday afternoon that would have cost us a full weekend of sales. That one alert paid for a year's subscription.",
    name: "Rahul Menon",
    role: "COO",
    company: "Cascade Foods, Mumbai",
    revenue: "₹1.8 Cr annual revenue",
  },
  {
    quote: "One login for billing, inventory and reports across all 4 branches. Our store managers actually enjoy using it — that alone was worth it.",
    name: "Ananya Iyer",
    role: "Head of Operations",
    company: "Halcyon Group, Chennai",
    revenue: "4 branches · ₹5.1 Cr revenue",
  },
];

function Testimonials() {
  return (
    <section id="stories" className="landing-testimonials bg-secondary/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Customer Stories</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Real businesses. Measurable results.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Nexora customers don't just save time — they make better decisions, catch more problems and grow faster.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] transition-all duration-300 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>

              <figcaption className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-sm font-bold text-white flex-shrink-0">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  <p className="text-xs font-medium text-[color:var(--brand-electric)] mt-0.5">{t.revenue}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PRICING
───────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    tagline: "For solo operators and small shops.",
    highlight: false,
    badge: null,
    features: [
      "Dashboard & analytics",
      "GST billing & invoicing",
      "Up to 500 invoices/month",
      "Customer management",
      "Inventory management",
      "Basic AI assistant",
      "PDF export & print",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    price: "₹499",
    period: "/month",
    tagline: "For growing businesses that need everything.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited invoices",
      "CRM & sales pipeline",
      "Finance & cash flow",
      "Full AI business assistant",
      "Recurring invoices",
      "Multi-user (up to 5)",
      "Razorpay & PhonePe",
      "WhatsApp notifications",
      "Priority support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For multi-branch and high-volume operations.",
    highlight: false,
    badge: null,
    features: [
      "Everything in Growth",
      "Multi-branch management",
      "Unlimited users",
      "Advanced AI & forecasting",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "Custom onboarding",
      "API access & webhooks",
      "SSO & advanced RBAC",
    ],
    cta: "Talk to Sales",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple, honest pricing.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            No hidden fees. No per-feature upsells. Choose a plan and get everything listed — including a 14-day free trial on every paid plan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                plan.highlight
                  ? "border-[color:var(--brand-electric)]/40 bg-[color:var(--brand-deep)] text-white shadow-[var(--shadow-elegant)] scale-[1.02]"
                  : "border-border bg-white shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1"
              }`}
            >
              {plan.highlight && (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_100%_0%,oklch(0.72_0.19_250/0.3),transparent_60%)]" />
              )}
              {plan.badge && (
                <div className="absolute -right-8 top-5 rotate-45 bg-[image:var(--gradient-brand)] px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {plan.badge}
                </div>
              )}

              <div className="relative p-8">
                <p className={`text-sm font-semibold ${plan.highlight ? "text-[color:var(--brand-glow)]" : "text-[color:var(--brand-electric)]"}`}>
                  {plan.name}
                </p>
                <p className={`mt-1 text-sm ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className={`text-5xl font-black tracking-tight ${plan.highlight ? "text-white" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-muted-foreground"}`}>
                      {plan.period} · GST inclusive
                    </span>
                  )}
                </div>

                <ul className={`mt-7 space-y-3 text-sm ${plan.highlight ? "text-white/80" : "text-foreground/80"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-[color:var(--brand-glow)]" : "text-[color:var(--brand-electric)]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    plan.highlight
                      ? "bg-white text-[color:var(--brand-deep)] hover:shadow-lg"
                      : "bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-elegant)] hover:shadow-[0_24px_60px_-16px_oklch(0.62_0.22_258/0.5)]"
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required to start.{" "}
          <a href="#faq" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Have questions? See FAQ →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   COMING SOON (ROADMAP)
───────────────────────────────────────────────────────────────── */

type RoadmapStatus = "In Development" | "In Design" | "Planned";

const ROADMAP: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  quarter: string;
  status: RoadmapStatus;
  value: string;
}[] = [
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    desc: "Sell, notify and support your customers where they already spend their time — with AI-powered replies and automated invoice delivery via WhatsApp.",
    quarter: "Q3 2026",
    status: "In Development",
    value: "Eliminate manual follow-up for 80% of payment reminders.",
  },
  {
    icon: UserCog,
    title: "Employee Management",
    desc: "A complete HR toolkit — attendance tracking, leave management, payroll calculation and performance reviews — built directly into your existing business OS.",
    quarter: "Q4 2026",
    status: "In Development",
    value: "Manage your entire workforce without a separate HR system.",
  },
  {
    icon: ShieldCheck,
    title: "Advanced Roles & Permissions",
    desc: "Granular access control with pre-built roles, custom permission sets and approval workflows — so every team member sees only what they need.",
    quarter: "Q4 2026",
    status: "In Design",
    value: "Prevent data leakage and enforce accountability at every level.",
  },
  {
    icon: Smartphone,
    title: "Native Mobile Apps",
    desc: "Full-featured Android and iOS apps that work fully offline — run billing, inventory and approvals from your pocket, with or without internet.",
    quarter: "Q1 2027",
    status: "In Design",
    value: "Stay in control of your business 24/7, from anywhere.",
  },
  {
    icon: Bot,
    title: "Specialised AI Agents",
    desc: "Dedicated AI agents for sales forecasting, inventory optimisation, accounting reconciliation and customer support — each trained on your business data.",
    quarter: "Q1 2027",
    status: "Planned",
    value: "Automate complex business decisions without hiring specialists.",
  },
  {
    icon: Puzzle,
    title: "Extended Integrations",
    desc: "Deep two-way sync with Tally ERP, Zoho Books, QuickBooks, POS machines and the complete suite of Indian enterprise tools including e-Invoice and e-Way Bill.",
    quarter: "Q2 2027",
    status: "Planned",
    value: "Connect your existing accounting stack without changing your workflow.",
  },
];

const STATUS_STYLE: Record<RoadmapStatus, { pill: string; bar: string; label: string }> = {
  "In Development": {
    pill: "bg-amber-50 border-amber-100 text-amber-700",
    bar: "bg-amber-400",
    label: "In Development",
  },
  "In Design": {
    pill: "bg-sky-50 border-sky-100 text-sky-700",
    bar: "bg-sky-400",
    label: "In Design",
  },
  Planned: {
    pill: "bg-slate-100 border-slate-200 text-slate-600",
    bar: "bg-slate-300",
    label: "Planned",
  },
};

function ComingSoon() {
  return (
    <section id="roadmap" className="landing-roadmap relative overflow-hidden py-24 lg:py-32">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,oklch(0.62_0.22_258/0.04),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Roadmap</SectionLabel>
          <h2 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            Built in the open.{" "}
            <span className="text-[color:var(--brand-electric)]">Shipped every month.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Every feature below is <strong className="font-semibold text-foreground">planned, not yet available.</strong> We publish our roadmap because transparency is the foundation of trust.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => {
            const s = STATUS_STYLE[r.status];
            return (
              <div
                key={r.title}
                className="group flex flex-col rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_oklch(0.14_0.02_260/0.10)]"
              >
                {/* Icon */}
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary text-[color:var(--brand-deep)] transition-colors duration-300 group-hover:bg-[image:var(--gradient-brand)] group-hover:border-transparent group-hover:text-white">
                  <r.icon className="h-6 w-6" />
                </div>

                {/* Title + desc */}
                <h3 className="text-[1.1rem] font-bold leading-snug text-foreground">{r.title}</h3>
                <p className="mt-3 text-sm leading-[1.7] text-muted-foreground flex-1">{r.desc}</p>

                {/* Divider */}
                <div className="my-6 h-px bg-border" />

                {/* Meta grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-muted-foreground">Expected release</span>
                    <span className="font-semibold text-foreground">{r.quarter}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-muted-foreground">Status</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${s.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.bar}`} />
                      {s.label}
                    </span>
                  </div>
                  <div className="rounded-xl bg-secondary/50 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Business value · </span>
                    {r.value}
                  </div>
                </div>

                {/* CTA */}
                <a
                  href="#contact"
                  className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--brand-electric)] transition-all duration-200 hover:gap-2.5"
                >
                  Get notified when it launches
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-14 max-w-lg text-center text-[12px] leading-relaxed text-muted-foreground">
          Roadmap items are shared for transparency and may shift. Nothing above is available today.{" "}
          <a className="font-semibold text-foreground underline underline-offset-4 hover:text-[color:var(--brand-electric)]" href="#contact">
            Request early access →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is GST fully supported, including e-invoicing?",
    a: "Yes. Nexora calculates CGST, SGST and IGST automatically on every invoice. You get monthly GST summaries, GSTR-1 export, and e-invoicing (IRN generation) support. GST compliance is core to the platform, not an add-on.",
  },
  {
    q: "How long does it take to get set up?",
    a: "Most businesses are billing their first customer within 30 minutes. Import your products from an Excel file, enter your GSTIN and bank details, and start. No consultant, no implementation project, no training budget.",
  },
  {
    q: "Can I migrate data from my existing software or Excel?",
    a: "Yes. Nexora supports bulk import of products, customers, suppliers and opening stock from CSV or Excel. For complex migrations from Tally or other software, our team assists at no extra cost.",
  },
  {
    q: "How does the AI assistant actually work?",
    a: "Nexora AI is trained on your business data — your products, customers, transactions and history. You ask questions in plain English (or Hindi) and it answers using your actual data. It can also draft invoices, generate reminders and flag anomalies proactively.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The web app is fully responsive and works on any phone, tablet or desktop browser without an install. Native Android and iOS apps with offline mode are on the roadmap.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data — customers, invoices, products, reports — in CSV or PDF format at any time. Your data belongs to you. We provide a 90-day data retention window after cancellation.",
  },
  {
    q: "Is multi-user access included?",
    a: "Growth plan includes up to 5 users. Enterprise plan is unlimited. Each user can be assigned a role (Admin, Manager, Cashier, Accountant, Warehouse) with custom permissions for exactly what they can see and do.",
  },
  {
    q: "How is my data secured?",
    a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3), stored on enterprise cloud infrastructure with daily automated backups and 30-day restore. No Nexora employee can read your data without explicit audit log entry.",
  },
  {
    q: "Can I manage multiple branches or stores?",
    a: "Yes, with the Enterprise plan. Each branch gets its own inventory, billing and reports, plus a centralised view across all branches. Central billing, stock transfer between branches, and branch performance comparison are all included.",
  },
  {
    q: "Do you offer a demo or onboarding help?",
    a: "Yes. Book a 30-minute live demo with our team who will walk through your specific business use case. Enterprise customers get a dedicated onboarding engineer and a custom setup session.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Questions business owners actually ask.
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const isLast = i === FAQS.length - 1;
            return (
              <div key={f.q} className={!isLast ? "border-b border-border" : ""}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground sm:text-base">{f.q}</span>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground pr-4">{f.a}</p>
                    )}
                  </div>
                  <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors">
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Still have questions?{" "}
          <a href="#contact" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Talk to our team →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONTACT
───────────────────────────────────────────────────────────────── */

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="bg-secondary/40 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Get in Touch</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Let's talk about your business.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Book a demo, ask a question, or request a custom quote. Our team is online and responds within 2 hours on business days.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email us", value: "hello@nexora.app", sub: "Replies within 2 hours" },
              { icon: Phone, title: "Call us", value: "+91 80 4718 0000", sub: "Mon–Sat, 9am–7pm IST" },
              { icon: MapPin, title: "Visit us", value: "Prestige Tower, 14th Floor", sub: "MG Road, Bengaluru 560001" },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-[color:var(--brand-electric)]/20 bg-[color:var(--brand-electric)]/5 p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Book a live demo</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                30 minutes with a Nexora product specialist. We'll walk through your specific business use case and answer every question.
              </p>
              <Btn href="#contact" size="sm" className="mt-4">
                Schedule Demo <ArrowRight className="h-3.5 w-3.5" />
              </Btn>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Full Name", type: "text", placeholder: "Aarav Sharma", required: true },
                { label: "Work Email", type: "email", placeholder: "you@company.com", required: true },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="text-xs font-semibold text-foreground">{f.label}</span>
                  <input required={f.required} type={f.type} placeholder={f.placeholder}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-foreground">Business Name</span>
              <input type="text" placeholder="Sharma Traders Pvt. Ltd."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-foreground">How can we help?</span>
              <textarea required rows={4} placeholder="Tell us about your business and what you're looking for…"
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
            </label>
            <button type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {sent ? "Message sent — we'll be in touch soon ✓" : (
                <><span>Send message</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              By submitting you agree to be contacted by the Nexora team. No spam, ever.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FINAL CTA
───────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section id="get-started" className="landing-cta relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[color:var(--brand-deep)] px-8 py-20 text-center text-white shadow-[var(--shadow-elegant)] sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_-10%,oklch(0.72_0.19_250/0.45),transparent_55%),radial-gradient(600px_300px_at_50%_120%,oklch(0.55_0.24_258/0.4),transparent_60%)]" />
          {/* Subtle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              14-day free trial · No credit card required
            </span>
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Ready to run your business on intelligence?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60 leading-relaxed">
              Join 12,000+ operators who replaced spreadsheets and disconnected tools with one platform that actually thinks.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Btn href="/signup" variant="white" size="lg">
                Start Free Trial — 14 days free <ArrowRight className="h-4 w-4" />
              </Btn>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                Book a Demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/50">
              {["No credit card needed", "Cancel anytime", "Live in 30 minutes", "Full support included"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[color:var(--brand-glow)]" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────────── */

function Footer() {
  const groups = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "AI Assistant", href: "#ai" },
        { label: "Roadmap", href: "#roadmap" },
        { label: "Changelog", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Retail & FMCG", href: "#" },
        { label: "Wholesale & Distribution", href: "#" },
        { label: "Restaurants & F&B", href: "#" },
        { label: "Healthcare & Pharma", href: "#" },
        { label: "Multi-branch Chains", href: "#" },
      ],
    },
    {
      title: "Developers",
      links: [
        { label: "API Reference", href: "#" },
        { label: "Documentation", href: "#" },
        { label: "Webhooks", href: "#" },
        { label: "SDKs", href: "#" },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Nexora", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press", href: "#" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Community", href: "#" },
        { label: "Book a Demo", href: "#contact" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      {/* Newsletter strip */}
      <div className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Stay ahead with Nexora updates</p>
              <p className="text-xs text-muted-foreground mt-0.5">Product launches, GST updates and business growth tips — monthly.</p>
            </div>
            <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-foreground outline-none transition focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
              <Btn href="#" size="sm">
                Subscribe
              </Btn>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-7">
          {/* Brand */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The AI Business Operating System. One intelligent platform to run billing, inventory, CRM, finance and teams — built for modern Indian businesses.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { label: "X", title: "Twitter / X" },
                { label: "In", title: "LinkedIn" },
                { label: "Ig", title: "Instagram" },
                { label: "Yt", title: "YouTube" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  title={s.title}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                {g.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Nexora Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {["Privacy Policy", "Terms of Service", "Security", "Cookie Policy"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-foreground">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */

function Landing() {
  // Safety net: Supabase email links land here with #access_token or #error
  // when /auth/callback isn't yet whitelisted in the Supabase redirect URLs list.
  // Use window.location.replace so the raw hash is preserved exactly as-is
  // (Supabase's client reads it directly from window.location.hash).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token=") || hash.includes("error="))) {
      window.location.replace(`/auth/callback${hash}`);
    }
  }, []);

  return (
    <div className="landing-page min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        <StatsBanner />
        <TrustedBy />
        <Features />
        <Solutions />
        <AIShowcase />
        <AIAgents />
        <WorkflowTour />
        <DashboardPreview />
        <Integrations />
        <Security />
        <About />
        <Testimonials />
        <Pricing />
        <ComingSoon />
        <FAQ />
        <Contact />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
