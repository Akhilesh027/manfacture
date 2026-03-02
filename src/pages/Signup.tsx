import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, 
  Mail, 
  MapPin, 
  FileText, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Users,
  Calendar,
  Briefcase,
  Globe,
  Shield,
  CheckCircle,
  Upload,
  FileText as FileTextIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    // Step 1: Company Information
    companyName: "",
    legalName: "",
    companyType: "",
    telephone: "",
    mobile: "",
    email: "",
    country: "",
    city: "",
    
    // Step 2: Business Details
    businessNature: "",
    yearEstablished: "",
    companyRelation: "",
    fullTimeEmployees: "",
    panNumber: "",
    gstNumber: "",
    
    // Step 3: Business Operations
    itemsInterested: "",
    legalDisputes: "",
    countriesExported: "",
    moreDescription: "",
    
    // Step 4: Account Security
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const companyTypes = [
    "Proprietorship",
    "Partnership",
    "Private Limited",
    "Public Limited",
    "LLP",
    "Other"
  ];

  const businessNatures = [
    "Manufacturer",
    "Trading",
    "Service Provider",
    "Distributor",
    "Wholesaler",
    "Retailer",
    "Exporter",
    "Importer"
  ];

  const companyRelations = [
    "Direct Vendor",
    "Sub-contractor",
    "Service Provider",
    "Consultant",
    "Other"
  ];

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        if (!form.companyName || !form.legalName || !form.companyType || 
            !form.mobile || !form.email || !form.country || !form.city) {
          toast({
            title: "Error",
            description: "Please fill all required fields in Company Information",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (!form.businessNature || !form.yearEstablished || !form.panNumber) {
          toast({
            title: "Error",
            description: "Please fill all required fields in Business Details",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (!form.itemsInterested) {
          toast({
            title: "Error",
            description: "Please specify items interested for supply/service",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 4:
        if (!form.password || !form.confirmPassword) {
          toast({
            title: "Error",
            description: "Please fill all required fields in Account Security",
            variant: "destructive",
          });
          return false;
        }
        if (form.password !== form.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return false;
        }
        if (form.password.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive",
          });
          return false;
        }
        if (!form.termsAccepted) {
          toast({
            title: "Error",
            description: "Please accept the terms and conditions",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      // Prepare the form data according to backend requirements
      const formData = {
        companyName: form.companyName,
        legalName: form.legalName,
        companyType: form.companyType,
        telephone: form.telephone || "",
        mobile: form.mobile,
        email: form.email,
        country: form.country,
        city: form.city,
        businessNature: form.businessNature,
        yearEstablished: form.yearEstablished,
        companyRelation: form.companyRelation || "",
        fullTimeEmployees: form.fullTimeEmployees || "0",
        panNumber: form.panNumber,
        gstNumber: form.gstNumber || "",
        itemsInterested: form.itemsInterested,
        legalDisputes: form.legalDisputes || "",
        countriesExported: form.countriesExported || "",
        moreDescription: form.moreDescription || "",
        password: form.password,
        confirmPassword: form.confirmPassword,
        termsAccepted: form.termsAccepted,
      };

      const res = await axios.post(
        "https://api.jsgallor.com/api/manufacturer/signup",
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.success) {
        toast({
          title: "Registration Successful!",
          description: res.data.message || "Your vendor registration has been submitted for approval.",
        });

        // Store token and user info
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.manufacturer.id);
        localStorage.setItem("manufacturer", JSON.stringify(res.data.manufacturer));

        navigate("/dashboard");
      } else {
        throw new Error(res.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errorMessages = error.response.data.errors.join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.response?.data?.message || error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Vendor Registration | JS Gallor Manufacturer Portal</title>
        <meta
          name="description"
          content="Register as a vendor/supplier with JS Gallor"
        />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent"></div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step === stepNum 
                      ? 'bg-yellow-500 border-yellow-500 text-black' 
                      : step > stepNum 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}>
                    {step > stepNum ? <CheckCircle className="w-5 h-5" /> : stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-16 h-1 mx-2 ${step > stepNum ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span className={step >= 1 ? "text-yellow-400" : ""}>Company Info</span>
              <span className={step >= 2 ? "text-yellow-400" : ""}>Business Details</span>
              <span className={step >= 3 ? "text-yellow-400" : ""}>Operations</span>
              <span className={step >= 4 ? "text-yellow-400" : ""}>Account Setup</span>
            </div>
          </div>

          <Card className="bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader className="pb-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-black" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-yellow-400">
                    {step === 1 && "Company Information"}
                    {step === 2 && "Business Details"}
                    {step === 3 && "Business Operations"}
                    {step === 4 && "Account Security"}
                  </CardTitle>
                  <p className="text-gray-400">
                    {step === 1 && "Enter your company's legal and contact information"}
                    {step === 2 && "Provide business registration and operational details"}
                    {step === 3 && "Describe your business operations and capabilities"}
                    {step === 4 && "Set up your account credentials"}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8">
              <form onSubmit={handleSignup} className="space-y-8">
                {/* Step 1: Company Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-gray-300 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Name of the Company *
                        </Label>
                        <Input
                          id="companyName"
                          placeholder="Enter company name"
                          value={form.companyName}
                          onChange={(e) =>
                            setForm({ ...form, companyName: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="legalName" className="text-gray-300 flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4" />
                          Full Legal Name *
                        </Label>
                        <Input
                          id="legalName"
                          placeholder="Enter legal registered name"
                          value={form.legalName}
                          onChange={(e) =>
                            setForm({ ...form, legalName: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyType" className="text-gray-300 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Type of Company *
                        </Label>
                        <select
                          id="companyType"
                          value={form.companyType}
                          onChange={(e) =>
                            setForm({ ...form, companyType: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                          required
                        >
                          <option value="">Select</option>
                          {companyTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telephone" className="text-gray-300 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Telephone
                        </Label>
                        <Input
                          id="telephone"
                          placeholder="Landline number"
                          value={form.telephone}
                          onChange={(e) =>
                            setForm({ ...form, telephone: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-gray-300 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Mobile *
                        </Label>
                        <Input
                          id="mobile"
                          placeholder="Mobile number"
                          value={form.mobile}
                          onChange={(e) =>
                            setForm({ ...form, mobile: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="company@email.com"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-300 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Select Country *
                        </Label>
                        <Input
                          id="country"
                          placeholder="Country"
                          value={form.country}
                          onChange={(e) =>
                            setForm({ ...form, country: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-300 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          City Name *
                        </Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={form.city}
                          onChange={(e) =>
                            setForm({ ...form, city: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessNature" className="text-gray-300 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Nature of Business *
                        </Label>
                        <select
                          id="businessNature"
                          value={form.businessNature}
                          onChange={(e) =>
                            setForm({ ...form, businessNature: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                          required
                        >
                          <option value="">Select</option>
                          {businessNatures.map((nature) => (
                            <option key={nature} value={nature}>{nature}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearEstablished" className="text-gray-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Year of Establishment *
                        </Label>
                        <Input
                          id="yearEstablished"
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="YYYY"
                          value={form.yearEstablished}
                          onChange={(e) =>
                            setForm({ ...form, yearEstablished: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyRelation" className="text-gray-300 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Relation With Company
                        </Label>
                        <select
                          id="companyRelation"
                          value={form.companyRelation}
                          onChange={(e) =>
                            setForm({ ...form, companyRelation: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                          <option value="">Select</option>
                          {companyRelations.map((relation) => (
                            <option key={relation} value={relation}>{relation}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullTimeEmployees" className="text-gray-300 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Number of Full-Time Employees
                        </Label>
                        <Input
                          id="fullTimeEmployees"
                          type="number"
                          min="0"
                          placeholder="Ex: 50"
                          value={form.fullTimeEmployees}
                          onChange={(e) =>
                            setForm({ ...form, fullTimeEmployees: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="panNumber" className="text-gray-300 flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4" />
                          PAN No *
                        </Label>
                        <Input
                          id="panNumber"
                          placeholder="ABCDE1234F"
                          value={form.panNumber}
                          onChange={(e) =>
                            setForm({ ...form, panNumber: e.target.value.toUpperCase() })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="text-gray-300 flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4" />
                          GST / VAT Number
                        </Label>
                        <Input
                          id="gstNumber"
                          placeholder="GST / VAT Number"
                          value={form.gstNumber}
                          onChange={(e) =>
                            setForm({ ...form, gstNumber: e.target.value.toUpperCase() })
                          }
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Business Operations */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="itemsInterested" className="text-gray-300 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Items Interested for Supply / Service *
                      </Label>
                      <Textarea
                        id="itemsInterested"
                        placeholder="Ex: Abrasives, Furniture, Textiles, Electronics"
                        value={form.itemsInterested}
                        onChange={(e) =>
                          setForm({ ...form, itemsInterested: e.target.value })
                        }
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[100px]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legalDisputes" className="text-gray-300 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Current Legal Disputes (if any)
                      </Label>
                      <Textarea
                        id="legalDisputes"
                        placeholder="Mention legal disputes if any"
                        value={form.legalDisputes}
                        onChange={(e) =>
                          setForm({ ...form, legalDisputes: e.target.value })
                        }
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countriesExported" className="text-gray-300 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Countries Exported / Projects Managed (Last 3 Years)
                      </Label>
                      <Textarea
                        id="countriesExported"
                        placeholder="List countries separated by commas"
                        value={form.countriesExported}
                        onChange={(e) =>
                          setForm({ ...form, countriesExported: e.target.value })
                        }
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moreDescription" className="text-gray-300 flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4" />
                        More Description
                      </Label>
                      <Textarea
                        id="moreDescription"
                        placeholder="Additional information about your company, capabilities, certifications, etc."
                        value={form.moreDescription}
                        onChange={(e) =>
                          setForm({ ...form, moreDescription: e.target.value })
                        }
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[100px]"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Account Security */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password *
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={(e) =>
                              setForm({ ...form, password: e.target.value })
                            }
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
                        <p className="text-xs text-gray-500">Minimum 6 characters with letters and numbers</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-300 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Confirm Password *
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                              setForm({ ...form, confirmPassword: e.target.value })
                            }
                            className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={form.termsAccepted}
                          onChange={(e) =>
                            setForm({ ...form, termsAccepted: e.target.checked })
                          }
                          className="mt-1 w-4 h-4 bg-gray-800 border-gray-700 rounded focus:ring-yellow-500 focus:ring-offset-gray-900"
                          required
                        />
                        <label htmlFor="terms" className="text-sm text-gray-300">
                          I warrant that the information provided is correct and any changes will be informed promptly. *
                        </label>
                      </div>

                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <h4 className="font-semibold text-yellow-400 mb-2">Registration Review</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>✓ Company Information: {form.companyName ? "Complete" : "Pending"}</li>
                          <li>✓ Business Details: {form.panNumber ? "Complete" : "Pending"}</li>
                          <li>✓ Operations Info: {form.itemsInterested ? "Complete" : "Pending"}</li>
                          <li>✓ Account Setup: {form.password ? "Complete" : "Pending"}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-gray-800">
                  <div>
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        ← Previous Step
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {step < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        Next Step
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                            Submitting Registration...
                          </span>
                        ) : (
                          <>
                            Submit Registration
                            <CheckCircle className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              {/* Step Indicator */}
              <div className="text-center mt-8 pt-6 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                  Step {step} of 4 • Complete all steps to register
                </p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center pt-8 border-t border-gray-800">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link 
                    to="/" 
                    className="font-semibold text-yellow-400 hover:text-yellow-300 hover:underline"
                  >
                    Login to your account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 JS Gallor Vendor Registration Portal. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Need help with registration? Contact vendor.support@jsgallor.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;