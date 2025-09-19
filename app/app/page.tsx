
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
      title: "Smart CSV Import",
      description: "Upload bank statements with intelligent column mapping"
    },
    {
      icon: PieChart,
      title: "Expense Tracking",
      description: "AI-powered categorization of your spending patterns"
    },
    {
      icon: Calculator,
      title: "Burn Rate Analysis",
      description: "Calculate how long your money will last at current spending"
    },
    {
      icon: Target,
      title: "Debt Strategies",
      description: "Snowball and avalanche methods for debt elimination"
    },
    {
      icon: TrendingUp,
      title: "Goal Setting",
      description: "Set and track emergency fund and savings goals"
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Beautiful charts showing your financial progress"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center">
                  <div className="bg-blue-600 rounded-lg p-2 mr-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">CFO Budgeting</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Take Control of Your 
              <span className="text-blue-600"> Financial Future</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The comprehensive budgeting app designed specifically for individuals in debt who need help creating their first budget. Get personalized strategies and clear insights to achieve financial freedom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                  Start Your Journey Free
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Budget Successfully
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to make budgeting simple and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who have taken control of their finances with our comprehensive budgeting platform.
          </p>
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Get Started Today - It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 rounded-lg p-2 mr-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CFO Budgeting</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering individuals to achieve financial freedom through smart budgeting
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 CFO Budgeting. Built for your financial success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
