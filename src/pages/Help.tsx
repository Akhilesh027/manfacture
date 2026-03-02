import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  MessageSquare,
  FileText,
  Video,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I get started with the portal?",
        answer: "After registration and verification, you can access all features. Start by completing your profile, then add products to your catalogue, set up factories, and start receiving orders from JS Gallor.",
      },
      {
        question: "How long does account verification take?",
        answer: "Account verification typically takes 24-48 hours. You'll receive an email notification once your account is verified. During this time, you can still complete your profile and explore the portal.",
      },
    ],
  },
  {
    category: "Catalogue Management",
    items: [
      {
        question: "How do I add a new product to my catalogue?",
        answer: "Navigate to Catalogue Management from the sidebar, click 'Add New Product', fill in all required details including name, category, price, and upload images. Click 'Save Product' to add it to your catalogue.",
      },
      {
        question: "Can I bulk upload products?",
        answer: "Currently, we support individual product uploads. For bulk uploads, please contact our support team for assistance with spreadsheet templates and mass upload options.",
      },
      {
        question: "How do I update product stock levels?",
        answer: "Go to Catalogue Management, find the product, click 'Edit', update the quantity field, and save changes. Stock levels are updated in real-time for JS Gallor buyers.",
      },
    ],
  },
  {
    category: "Orders & Payments",
    items: [
      {
        question: "How do I view and manage orders?",
        answer: "All orders from JS Gallor appear in your Orders dashboard. You can view order details, update status (Processing, Shipped, Delivered), and track order history from this section.",
      },
      {
        question: "What are the payment terms?",
        answer: "Payments are processed within 15 days of order delivery. You can view payment status and download invoices from the Orders section. For detailed payment schedules, refer to your vendor agreement.",
      },
      {
        question: "How do I handle order returns?",
        answer: "Initiate return requests through the Orders section. Select the order, choose 'Return Request', specify reason, and submit. Our support team will guide you through the return process.",
      },
    ],
  },
  {
    category: "Factory & Locations",
    items: [
      {
        question: "How can I add multiple factories?",
        answer: "Go to Factories / Locations, click 'Add New Factory', enter factory details including location, capacity, and manager information. You can add and manage multiple production facilities.",
      },
      {
        question: "Can I assign products to specific factories?",
        answer: "Yes! When adding or editing products, you can specify the manufacturing location. This helps in inventory management and order fulfillment from specific factory locations.",
      },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      {
        question: "How do I update my company information?",
        answer: "Navigate to Profile from the sidebar. All your registration details are editable here. Click 'Edit Profile', make your changes, and save. Some changes may require re-verification.",
      },
      {
        question: "How do I change my password?",
        answer: "Go to Profile, click on 'Security Settings' (available in edit mode), enter your current password and new password, then confirm. Passwords must be at least 6 characters.",
      },
    ],
  },
];

const Help = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleAccordion = (value: string) => {
    setExpandedItems(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const filteredFAQs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  const allFAQs = filteredFAQs.flatMap(category => category.items);

  return (
    <>
      <Helmet>
        <title>Help & Support | JS Gallor Manufacturer Portal</title>
        <meta name="description" content="Get help and support for using the JS Gallor manufacturer portal" />
      </Helmet>

      <DashboardLayout title="Help & Support">
        <div className="max-w-6xl mx-auto">
          {/* Search Section */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-black" />
                </div>
                <h1 className="text-3xl font-bold text-yellow-400 mb-3">How can we help you today?</h1>
                <p className="text-gray-400">Find answers to common questions or contact our support team</p>
              </div>

              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search for help topics, questions, or guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-gray-800 border-gray-700 text-white focus:border-yellow-500 py-6"
                />
                {searchTerm && (
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Found {allFAQs.length} result{allFAQs.length !== 1 ? 's' : ''} for "{searchTerm}"
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Chat Support</h3>
                <p className="text-gray-400 text-sm mb-4">Chat with our support team in real-time</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
                <p className="text-gray-400 text-sm mb-4">Browse our comprehensive guides and tutorials</p>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View Docs
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Video Tutorials</h3>
                <p className="text-gray-400 text-sm mb-4">Watch step-by-step video guides</p>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Watch Videos
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {filteredFAQs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-400 border-b border-gray-800 pb-2">
                  {category.category}
                </h2>
                
                <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
                  {category.items.map((item, itemIndex) => {
                    const itemId = `${categoryIndex}-${itemIndex}`;
                    return (
                      <AccordionItem
                        key={itemId}
                        value={itemId}
                        className="bg-gray-900 border border-gray-800 rounded-lg mb-3 overflow-hidden"
                      >
                        <AccordionTrigger className="flex items-center justify-between w-full p-5 text-left hover:no-underline hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-900/30 rounded flex items-center justify-center">
                              <HelpCircle className="w-4 h-4 text-yellow-400" />
                            </div>
                            <span className="font-semibold text-white text-lg">{item.question}</span>
                          </div>
                          <div className="text-yellow-400">
                            {expandedItems.includes(itemId) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5 pt-0">
                          <div className="pl-11">
                            <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-yellow-500">
                              <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact Support Section */}
          <Card className="bg-gray-900 border-gray-800 mt-12">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-3">
                <Users className="w-6 h-6" />
                Contact Our Support Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Email Support</h4>
                      <p className="text-gray-400 text-sm">support@jsgallor.com</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">For detailed queries and documentation requests</p>
                  <Button 
                    variant="outline" 
                    className="border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  >
                    Send Email
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Phone Support</h4>
                      <p className="text-gray-400 text-sm">+91 1800 123 4567</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Direct assistance for urgent matters</p>
                  <Button 
                    variant="outline" 
                    className="border-green-800 text-green-400 hover:bg-green-900/30"
                  >
                    Call Now
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Support Hours</h4>
                      <p className="text-gray-400 text-sm">Mon - Sat, 9 AM - 6 PM IST</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">24/7 emergency support available for critical issues</p>
                  <Button 
                    variant="outline" 
                    className="border-yellow-800 text-yellow-400 hover:bg-yellow-900/30"
                  >
                    Check Status
                  </Button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800">
                <h4 className="font-semibold text-white mb-4">Additional Resources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    Vendor Knowledge Base
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    API Documentation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    Terms of Service
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    Privacy Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Status */}
          <Card className="bg-gray-900 border-gray-800 mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-white">Support System Status</h4>
                    <p className="text-gray-400 text-sm">All systems operational</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Last updated: </span>
                  <span className="text-green-400">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Help;