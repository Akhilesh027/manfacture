import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I add a new product to my catalogue?",
    answer: "Go to Catalogue Management from the sidebar, click on 'Add Product', fill in the product details including name, category, SKU, and description, then click 'Save Product'.",
  },
  {
    question: "How can I update my factory information?",
    answer: "Navigate to Factories / Locations, find the factory you want to edit, click the 'Edit' button, make your changes, and save.",
  },
  {
    question: "How do I view order details?",
    answer: "Go to Orders from JS Gallor, find the order in the table, and click the 'View' button to see complete order details including product, quantity, date, and status.",
  },
  {
    question: "Can I change my company profile information?",
    answer: "Yes! Go to Profile from the sidebar where you can update your company name, email, phone number, GST number, and address.",
  },
  {
    question: "How do I logout from the portal?",
    answer: "Click on 'Logout' at the bottom of the sidebar menu. This will safely log you out and redirect you to the login page.",
  },
];

const Help = () => {
  return (
    <>
      <Helmet>
        <title>Help & Support | Manufacturer Portal</title>
        <meta name="description" content="Get help and support for using the manufacturer portal" />
      </Helmet>

      <DashboardLayout title="Help & Support">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card rounded-xl shadow-card border-none px-5 hover:shadow-card-hover transition-all data-[state=open]:shadow-card-hover"
            >
              <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="bg-card p-6 rounded-xl shadow-card mt-10">
          <h2 className="text-xl font-semibold mb-3">Need More Help?</h2>
          <p className="text-muted-foreground mb-2">
            Contact our support team for assistance:
          </p>
          <p className="text-sm text-muted-foreground">
            📧 Email: support@jsgallor.com<br />
            📞 Phone: +91 1800 123 4567<br />
            🕐 Available: Mon-Sat, 9 AM - 6 PM IST
          </p>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Help;
