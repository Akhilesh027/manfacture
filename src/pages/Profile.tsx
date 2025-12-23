import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const [profile, setProfile] = useState({
    companyName: "Galaxy Industries",
    email: "contact@galaxyindustries.com",
    phone: "+91 98765 43210",
    gst: "27AABCU9603R1ZM",
    address: "Industrial Area, Mumbai, Maharashtra",
  });

  const handleSave = () => {
    toast({ title: "Saved", description: "Profile updated successfully" });
  };

  return (
    <>
      <Helmet>
        <title>Profile | Manufacturer Portal</title>
        <meta name="description" content="Manage your manufacturer profile settings" />
      </Helmet>

      <DashboardLayout title="Profile Settings">
        <div className="bg-card p-8 max-w-xl rounded-2xl shadow-card animate-fade-in-up">
          <div className="space-y-5">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={profile.gst}
                onChange={(e) => setProfile({ ...profile, gst: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <Button onClick={handleSave} className="mt-4">
              Save Changes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Profile;
