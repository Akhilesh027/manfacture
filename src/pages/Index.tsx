import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Building2, 
  Package, 
  Factory, 
  ShoppingCart, 
  Users,
  Shield,
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  PlayCircle
} from "lucide-react";

const benefits = [
  { 
    icon: ShoppingCart, 
    title: "Direct Access to Buyers", 
    description: "Get direct purchase orders from JS Gallor with no intermediaries. Connect with major retail chains nationwide." 
  },
  { 
    icon: Package, 
    title: "Easy Catalogue Management", 
    description: "Add, edit, and update product catalogues in real time. Upload images, manage inventory, and set prices easily." 
  },
  { 
    icon: Factory, 
    title: "Manage Factories & Locations", 
    description: "Keep your operational data organised and accessible. Track multiple production facilities from one dashboard." 
  },
  { 
    icon: TrendingUp, 
    title: "Fast Order Processing", 
    description: "Receive and accept orders instantly within your dashboard. Real-time notifications for new orders and updates." 
  },
  { 
    icon: Users, 
    title: "Network of Manufacturers", 
    description: "Join 500+ trusted manufacturers already growing their business with JS Gallor's platform." 
  },
  { 
    icon: Shield, 
    title: "Secure & Verified Platform", 
    description: "Enterprise-grade security with verified buyers and secure payment processing for all transactions." 
  },
];

const testimonials = [
  {
    name: "Rahul Sharma",
    company: "Sharma Furniture Works",
    text: "Our sales grew by 300% in the first 6 months after joining JS Gallor. The direct retailer connections are invaluable.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Priya Patel",
    company: "Patel Textile Mills",
    text: "Managing multiple factories and orders became so much easier. The dashboard gives us complete control over our operations.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w-400"
  },
  {
    name: "Vikram Singh",
    company: "Singh Metal Works",
    text: "The real-time order tracking and direct communication with buyers have transformed how we do business.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
];

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const navigate = useNavigate();

  // Auto-play testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://api.jsgallor.com/api/manufacturer/login",
        { email, password }
      );

      // Save token
      localStorage.setItem("token", res.data.token);
             localStorage.setItem("userId", res.data.manufacturer.id);

      localStorage.setItem(
        "manufacturer",
        JSON.stringify(res.data.manufacturer)
      );

      toast({
        title: "Welcome back!",
        description: "Login successful",
      });

      setLoginOpen(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>JS Gallor Manufacturer Portal | Connect & Grow Your Business</title>
        <meta
          name="description"
          content="Join JS Gallor as a manufacturer. Get direct access to buyers, manage catalogues, and process orders efficiently."
        />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-400 tracking-tight">JS Gallor</div>
              <div className="text-xs text-gray-400">Manufacturer Portal</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLoginOpen(true)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Login
            </Button>
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 md:px-16 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/30 rounded-full border border-yellow-800 mb-6">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-yellow-400">Join 500+ Trusted Manufacturers</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    Grow Your <span className="text-yellow-400">Manufacturing</span> Business
                  </h1>
                  
                  <p className="text-xl text-gray-300 mt-6 max-w-2xl">
                    Partner with India's premier retail network. Get direct access to major buyers, 
                    manage your entire operation from one dashboard, and scale your business faster.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 py-6"
                    onClick={() => navigate("/signup")}
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-6"
                    onClick={() => {
                      const element = document.getElementById('features');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    See How It Works
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-800">
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">500+</div>
                    <div className="text-sm text-gray-400">Manufacturers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">₹10Cr+</div>
                    <div className="text-sm text-gray-400">Monthly Orders</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">24/7</div>
                    <div className="text-sm text-gray-400">Support</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Image/Preview */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1581090464777-44ea247c5c23?w=1920"
                    alt="Manufacturing Dashboard Preview"
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-6 left-6 bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-800 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-900/30 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">New Order Received</div>
                        <div className="text-xs text-gray-400">₹2,45,000 • Just now</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 right-6 bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-800 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-900/30 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">Revenue This Month</div>
                        <div className="text-lg text-yellow-400 font-bold">₹12,84,567</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-20 px-6 md:px-16 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Everything You Need to <span className="text-yellow-400">Scale</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                A complete platform designed specifically for manufacturers to manage, grow, and optimize their business.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={i} 
                    className="bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-colors group hover:shadow-xl"
                  >
                    <div className="p-4 bg-yellow-900/30 rounded-xl w-fit mb-6 group-hover:bg-yellow-900/50 transition-colors">
                      <Icon className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Trusted by <span className="text-yellow-400">Industry Leaders</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                See what manufacturers across India are saying about their experience with JS Gallor.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl bg-gray-900 border border-gray-800">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="w-full flex-shrink-0 p-12">
                      <div className="max-w-3xl mx-auto text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border-4 border-yellow-400">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-2xl italic text-gray-300 mb-8">
                          "{testimonial.text}"
                        </p>
                        <div>
                          <div className="text-xl font-bold text-white">{testimonial.name}</div>
                          <div className="text-yellow-400">{testimonial.company}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentTestimonial(prev => 
                      prev === 0 ? testimonials.length - 1 : prev - 1
                    );
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentTestimonial(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentTestimonial 
                          ? 'bg-yellow-400 w-8' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentTestimonial(prev => 
                      prev === testimonials.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 md:px-16 bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-900/30 rounded-full border border-yellow-800 mb-8">
              <CheckCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">No credit card required for trial</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Manufacturing Business?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
              Join hundreds of manufacturers who are already growing their business with JS Gallor. 
              Get started with a free 30-day trial.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-10 py-6"
                onClick={() => navigate("/signup")}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white px-10 py-6"
                onClick={() => setLoginOpen(true)}
              >
                Schedule a Demo
              </Button>
            </div>
            
            <p className="text-gray-500 mt-8 text-sm">
              No setup fees • Cancel anytime • 24/7 support included
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 md:px-16 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-400">JS Gallor</div>
                  <div className="text-sm text-gray-400">Manufacturer Portal</div>
                </div>
              </div>
              
              <div className="text-gray-400 text-sm">
                © 2024 JS Gallor Manufacturer Portal. All rights reserved.
              </div>
              
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-yellow-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Login Modal */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-black" />
                </div>
                <DialogTitle className="text-yellow-400">Welcome Back</DialogTitle>
              </div>
              <p className="text-gray-400 text-sm">Sign in to your manufacturer account</p>
            </DialogHeader>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-6"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center pt-4 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-yellow-400 hover:text-yellow-300 hover:underline"
                    onClick={() => setLoginOpen(false)}
                  >
                    Create Account
                  </Link>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  <a href="#" className="hover:text-yellow-400">Forgot your password?</a>
                </p>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Index;