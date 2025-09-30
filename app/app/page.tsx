
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Target, 
  Shield, 
  Calculator,
  BarChart3,
  Upload
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  const features = [
    {
      icon: Upload,
      title: "SMART CSV IMPORT",
      description: "Upload bank statements with intelligent column mapping"
    },
    {
      icon: PieChart,
      title: "EXPENSE TRACKING",
      description: "AI-powered categorization of your spending patterns"
    },
    {
      icon: Calculator,
      title: "BURN RATE ANALYSIS",
      description: "Calculate how long your money will last at current spending"
    },
    {
      icon: Target,
      title: "DEBT STRATEGIES",
      description: "Snowball and avalanche methods for debt elimination"
    },
    {
      icon: TrendingUp,
      title: "GOAL SETTING",
      description: "Set and track emergency fund and savings goals"
    },
    {
      icon: BarChart3,
      title: "VISUAL ANALYTICS",
      description: "Beautiful charts showing your financial progress"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center">
                  <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-2.5 mr-3 shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-foreground tracking-tight">CFO Budgeting</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="btn-primary shadow-md">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl mb-8 shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-display text-foreground mb-8 max-w-5xl mx-auto">
              TAKE CONTROL OF YOUR 
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"> FINANCIAL FUTURE</span>
            </h1>
            <p className="text-body text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              The comprehensive budgeting app designed specifically for individuals in debt who need help creating their first budget. Get personalized strategies and clear insights to achieve financial freedom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up">
              <Link href="/auth/signup">
                <Button size="lg" className="btn-primary px-8 py-4 text-lg shadow-lg hover:shadow-xl">
                  Start Your Journey Free
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-border/60 hover:bg-muted/50">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-heading text-foreground mb-6">
              EVERYTHING YOU NEED TO BUDGET SUCCESSFULLY
            </h2>
            <p className="text-subheading text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make budgeting simple and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="card-premium-elevated group hover:scale-[1.02] transition-all duration-300 animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl mb-4 group-hover:from-primary/20 group-hover:to-blue-200 transition-all duration-300">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-subheading text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-body text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-heading text-white mb-8">
            READY TO TRANSFORM YOUR FINANCIAL LIFE?
          </h2>
          <p className="text-subheading text-blue-100 mb-10 leading-relaxed">
            Join thousands who have taken control of their finances with our comprehensive budgeting platform.
          </p>
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Get Started Today - It's Free
              <Target className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-2.5 mr-3 shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CFO Budgeting</span>
            </div>
            <p className="text-gray-300 mb-6 text-body leading-relaxed max-w-md mx-auto">
              Empowering individuals to achieve financial freedom through smart budgeting
            </p>
            <p className="text-gray-500 text-small">
              © 2024 CFO Budgeting. Built for your financial success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
