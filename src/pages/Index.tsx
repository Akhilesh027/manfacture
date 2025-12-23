import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const benefits = [
  { title: "Direct Access to Buyers", description: "Get direct purchase orders from JS Gallor with no intermediaries." },
  { title: "Easy Catalogue Management", description: "Add, edit, and update product catalogues in real time." },
  { title: "Manage Factories & Locations", description: "Keep your operational data organised and accessible." },
  { title: "Fast Order Processing", description: "Receive and accept orders instantly within your dashboard." },
];

const carouselImages = [
  "https://images.unsplash.com/photo-1581090464777-44ea247c5c23?w=1920",
  "https://images.unsplash.com/photo-1532635247-3f9c3ac3dbf5?w=1920",
  "https://images.unsplash.com/photo-1581091870622-df7ea87f9a93?w=1920",
];

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!", description: "Login successful" });
    setLoginOpen(false);
    navigate("/dashboard");
  };

  return (
    <>
      <Helmet>
        <title>JS Gallor Manufacturer Portal | Connect & Grow Your Business</title>
        <meta name="description" content="Join JS Gallor as a manufacturer. Get direct access to buyers, manage catalogues, and process orders efficiently." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-card/90 backdrop-blur-md border-b border-border">
          <div className="text-2xl font-bold tracking-tight">JS Gallor</div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLoginOpen(true)}>
              Login
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </header>

        {/* Hero Carousel */}
        <section className="relative h-[80vh] mt-[72px] overflow-hidden">
          {carouselImages.map((img, i) => (
            <div
              key={i}
              className="carousel-slide absolute inset-0 bg-cover bg-center opacity-0"
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 to-foreground/20" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-card px-6">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                Grow Your Manufacturing Business
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 drop-shadow">
                Partner with JS Gallor and reach thousands of buyers directly
              </p>
              <Button size="lg" className="mt-8" onClick={() => setLoginOpen(true)}>
                Get Started
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 md:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits of Joining JS Gallor as a Manufacturer</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Unlock new opportunities and streamline your business operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-card p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
              >
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-sidebar text-sidebar-foreground py-6 px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-medium">JS Gallor Manufacturer Portal</div>
          <div className="flex gap-6 text-sm opacity-80">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms & Conditions</a>
          </div>
        </footer>

        {/* Login Modal */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="max-w-sm animate-pop-in">
            <DialogHeader>
              <DialogTitle>Login</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
            <p className="text-center text-sm mt-2">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline" onClick={() => setLoginOpen(false)}>
                Sign Up
              </Link>
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Index;
