import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { 
  Building2, 
  Mail, 
  MapPin, 
  FileText, 
  Phone, 
  Lock,
  Users,
  Calendar,
  Briefcase,
  Globe,
  Shield,
  Upload,
  FileText as FileTextIcon,
  Edit,
  Save,
  X,
  CheckCircle,
  User,
  Award,
  DollarSign,
  Package,
  Factory
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    // Company Information
    companyName: "",
    legalName: "",
    companyType: "",
    telephone: "",
    mobile: "",
    email: "",
    country: "",
    city: "",
    
    // Business Details
    businessNature: "",
    yearEstablished: "",
    companyRelation: "",
    fullTimeEmployees: "",
    panNumber: "",
    gstNumber: "",
    
    // Business Operations
    itemsInterested: "",
    legalDisputes: "",
    countriesExported: "",
    moreDescription: "",
    registrationDate: "",
    verificationStatus: "Pending",
    
    // Statistics
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    factoriesLinked: 0,
  });

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.jsgallor.com/api/manufacturer/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data.data;
      setProfile({
        companyName: data.companyName || "",
        legalName: data.legalName || "",
        companyType: data.companyType || "",
        telephone: data.telephone || "",
        mobile: data.mobile || "",
        email: data.email || "",
        country: data.country || "",
        city: data.city || "",
        businessNature: data.businessNature || "",
        yearEstablished: data.yearEstablished || "",
        companyRelation: data.companyRelation || "",
        fullTimeEmployees: data.fullTimeEmployees || "",
        panNumber: data.panNumber || "",
        gstNumber: data.gstNumber || "",
        itemsInterested: data.itemsInterested || "",
        legalDisputes: data.legalDisputes || "",
        countriesExported: data.countriesExported || "",
        moreDescription: data.moreDescription || "",
        registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
        verificationStatus: data.verificationStatus || "Pending",
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        activeProducts: data.activeProducts || 0,
        factoriesLinked: data.factoriesLinked || 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        companyName: profile.companyName,
        legalName: profile.legalName,
        companyType: profile.companyType,
        telephone: profile.telephone,
        mobile: profile.mobile,
        country: profile.country,
        city: profile.city,
        businessNature: profile.businessNature,
        yearEstablished: profile.yearEstablished,
        companyRelation: profile.companyRelation,
        fullTimeEmployees: profile.fullTimeEmployees,
        panNumber: profile.panNumber,
        gstNumber: profile.gstNumber,
        itemsInterested: profile.itemsInterested,
        legalDisputes: profile.legalDisputes,
        countriesExported: profile.countriesExported,
        moreDescription: profile.moreDescription,
      };

      await axios.put(
        `https://api.jsgallor.com/api/manufacturer/profile/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified": return "bg-green-900/30 text-green-400 border border-green-800";
      case "Pending": return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      case "Rejected": return "bg-red-900/30 text-red-400 border border-red-800";
      default: return "bg-gray-800 text-gray-400";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile | JS Gallor Vendor Portal</title>
        <meta
          name="description"
          content="View and manage your vendor profile"
        />
      </Helmet>

      <DashboardLayout title="Vendor Profile">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{profile.companyName}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.verificationStatus)}`}>
                      {profile.verificationStatus}
                    </span>
                    <span className="text-gray-400 text-sm">
                      Registered on {new Date(profile.registrationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                {profile.legalName} • {profile.companyType} • {profile.city}, {profile.country}
              </p>
            </div>
            
            <div className="flex gap-3">
              {editing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditing(false);
                      fetchProfile();
                    }}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setEditing(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{profile.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-yellow-900/30 rounded-lg">
                    <Package className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">₹{profile.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Products</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{profile.activeProducts}</p>
                  </div>
                  <div className="p-3 bg-blue-900/30 rounded-lg">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Factories Linked</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{profile.factoriesLinked}</p>
                  </div>
                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <Factory className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Company Name</Label>
                        {editing ? (
                          <Input
                            value={profile.companyName}
                            onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1">{profile.companyName}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Legal Name</Label>
                        {editing ? (
                          <Input
                            value={profile.legalName}
                            onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1">{profile.legalName}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Company Type</Label>
                        {editing ? (
                          <Input
                            value={profile.companyType}
                            onChange={(e) => setProfile({ ...profile, companyType: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1">{profile.companyType}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Email Address</Label>
                        <p className="text-white mt-1 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Contact Numbers</Label>
                        <div className="mt-1 space-y-2">
                          {editing ? (
                            <>
                              <Input
                                placeholder="Telephone"
                                value={profile.telephone}
                                onChange={(e) => setProfile({ ...profile, telephone: e.target.value })}
                                className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                              />
                              <Input
                                placeholder="Mobile"
                                value={profile.mobile}
                                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                                className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-white flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {profile.telephone || "Not provided"}
                              </p>
                              <p className="text-white flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {profile.mobile}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Location</Label>
                        {editing ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              placeholder="Country"
                              value={profile.country}
                              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                            />
                            <Input
                              placeholder="City"
                              value={profile.city}
                              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                            />
                          </div>
                        ) : (
                          <p className="text-white mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {profile.city}, {profile.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Nature of Business</Label>
                        {editing ? (
                          <Input
                            value={profile.businessNature}
                            onChange={(e) => setProfile({ ...profile, businessNature: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1">{profile.businessNature}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Year Established</Label>
                        {editing ? (
                          <Input
                            type="number"
                            value={profile.yearEstablished}
                            onChange={(e) => setProfile({ ...profile, yearEstablished: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {profile.yearEstablished}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Full-Time Employees</Label>
                        {editing ? (
                          <Input
                            value={profile.fullTimeEmployees}
                            onChange={(e) => setProfile({ ...profile, fullTimeEmployees: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            {profile.fullTimeEmployees || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Legal Documents</Label>
                        <div className="mt-1 space-y-2">
                          {editing ? (
                            <>
                              <Input
                                placeholder="PAN Number"
                                value={profile.panNumber}
                                onChange={(e) => setProfile({ ...profile, panNumber: e.target.value })}
                                className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                              />
                              <Input
                                placeholder="GST/VAT Number"
                                value={profile.gstNumber}
                                onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                                className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                PAN: {profile.panNumber}
                              </p>
                              <p className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                GST/VAT: {profile.gstNumber || "Not provided"}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Relation with JS Gallor</Label>
                        {editing ? (
                          <Input
                            value={profile.companyRelation}
                            onChange={(e) => setProfile({ ...profile, companyRelation: e.target.value })}
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        ) : (
                          <p className="text-white mt-1">{profile.companyRelation || "Not specified"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Operations */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Business Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-400 text-sm">Items Interested for Supply/Service</Label>
                    {editing ? (
                      <Textarea
                        value={profile.itemsInterested}
                        onChange={(e) => setProfile({ ...profile, itemsInterested: e.target.value })}
                        className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[100px]"
                      />
                    ) : (
                      <p className="text-white mt-1 whitespace-pre-wrap">{profile.itemsInterested}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-400 text-sm">Countries Exported / Projects Managed (Last 3 Years)</Label>
                    {editing ? (
                      <Textarea
                        value={profile.countriesExported}
                        onChange={(e) => setProfile({ ...profile, countriesExported: e.target.value })}
                        className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[80px]"
                      />
                    ) : (
                      <p className="text-white mt-1 whitespace-pre-wrap">{profile.countriesExported || "Not provided"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-400 text-sm">Current Legal Disputes (if any)</Label>
                    {editing ? (
                      <Textarea
                        value={profile.legalDisputes}
                        onChange={(e) => setProfile({ ...profile, legalDisputes: e.target.value })}
                        className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[80px]"
                      />
                    ) : (
                      <p className="text-white mt-1 whitespace-pre-wrap">{profile.legalDisputes || "None reported"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-400 text-sm">Additional Information</Label>
                    {editing ? (
                      <Textarea
                        value={profile.moreDescription}
                        onChange={(e) => setProfile({ ...profile, moreDescription: e.target.value })}
                        className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-yellow-500 min-h-[100px]"
                      />
                    ) : (
                      <p className="text-white mt-1 whitespace-pre-wrap">{profile.moreDescription || "No additional information provided"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Verification Status */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          profile.verificationStatus === "Verified" ? "bg-green-500" :
                          profile.verificationStatus === "Pending" ? "bg-yellow-500" : "bg-red-500"
                        }`}></div>
                        <span className="text-white">Account Status</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.verificationStatus)}`}>
                        {profile.verificationStatus}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        profile.verificationStatus === "Verified" ? "bg-green-500 w-full" :
                        profile.verificationStatus === "Pending" ? "bg-yellow-500 w-2/3" : "bg-red-500 w-1/3"
                      }`}></div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Company Details</span>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Legal Documents</span>
                        {profile.panNumber ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <span className="text-yellow-400 text-xs">Required</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Business Verification</span>
                        {profile.verificationStatus === "Verified" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <span className="text-yellow-400 text-xs">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Registration Date</span>
                      <span className="text-gray-400">{new Date(profile.registrationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Member Since</span>
                      <span className="text-gray-400">
                        {Math.floor((new Date().getTime() - new Date(profile.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Last Updated</span>
                      <span className="text-gray-400">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Support */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm">
                      For profile verification or document updates, contact our vendor support team.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Profile;