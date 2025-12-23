import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    location: "",
    gst: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.companyName || !form.location || !form.password) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    toast({ title: "Account Created", description: "Welcome to the Manufacturer Portal!" });
    navigate("/dashboard");
  };

  return (
    <>
      <Helmet>
        <title>Sign Up | Manufacturer Portal</title>
        <meta name="description" content="Create your manufacturer account to join JS Gallor" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-secondary to-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card p-10 rounded-2xl shadow-modal animate-fade-in-up">
          <h2 className="text-2xl font-bold text-center mb-6">Create Your Manufacturer Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              placeholder="Company Name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Input
              placeholder="GST Number"
              value={form.gst}
              onChange={(e) => setForm({ ...form, gst: e.target.value })}
            />
            <Input
              placeholder="Contact Details"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Create Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
