import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  Map,
  Building2,
  QrCode,
  MessageSquare,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Event Registration",
    description: "Customizable registration forms, ticketing, and payment processing with Stripe integration.",
  },
  {
    icon: Map,
    title: "Floor Plan Designer",
    description: "Import CAD files and create interactive booth layouts with drag-and-drop editing.",
  },
  {
    icon: Building2,
    title: "Venue Sourcing",
    description: "Search venues, send RFPs, and compare bids all in one place.",
  },
  {
    icon: QrCode,
    title: "Onsite Check-in",
    description: "QR code scanning, badge printing, and real-time attendance tracking.",
  },
  {
    icon: Users,
    title: "Networking Hub",
    description: "Smart matchmaking, meeting scheduling, and real-time chat for attendees.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track registrations, revenue, engagement, and generate detailed reports.",
  },
]

const benefits = [
  "Unlimited events and attendees",
  "Real-time collaboration",
  "Custom branding",
  "API access",
  "24/7 support",
  "Data export",
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">EventX</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
              <Zap className="mr-2 h-4 w-4 text-primary" />
              The Complete Event Management Platform
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Plan, Manage, and Execute
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {" "}Unforgettable Events
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              From venue sourcing to post-event analytics, EventX provides everything you need 
              to create exceptional experiences. Registration, floor planning, networking, and more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Everything You Need for Successful Events
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A comprehensive suite of tools designed to streamline every aspect of event management.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                Why Choose EventX?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Built by event professionals for event professionals. We understand 
                the challenges you face and have designed every feature to make your job easier.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-xl border bg-gradient-to-br from-primary/20 to-purple-500/20">
                <div className="flex h-full items-center justify-center">
                  <MessageSquare className="h-24 w-24 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Events?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join thousands of event organizers who trust EventX to deliver exceptional experiences.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-bold">EventX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EventX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
