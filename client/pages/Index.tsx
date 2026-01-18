import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

interface FormData {
  designNumber: string;
  style: string;
  goldKarat: string;
  approxGoldWeight: string;
  stoneType: string;
  diamondShape: string;
  caratWeight: string;
  clarity: string;
  sideStoneShape: string;
  approxWeight: string;
  brandText: string;
  logoFile?: File;
}

export default function Index() {
  const [formData, setFormData] = useState<FormData>({
    designNumber: "",
    style: "",
    goldKarat: "",
    approxGoldWeight: "",
    stoneType: "",
    diamondShape: "",
    caratWeight: "",
    clarity: "",
    sideStoneShape: "",
    approxWeight: "",
    brandText: "",
  });
  const [logoFileName, setLogoFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [showReview, setShowReview] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logoFile: file }));
      setLogoFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReview = () => {
    setShowReview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: Record<string, string> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "logoFile" && value) {
          submitData[key] = value;
        }
      });

      if (logoFileName) {
        submitData.logoFileName = logoFileName;
      }

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error("Failed to submit");

      toast.success("Design submitted successfully!");
      setFormData({
        designNumber: "",
        style: "",
        goldKarat: "",
        approxGoldWeight: "",
        stoneType: "",
        diamondShape: "",
        caratWeight: "",
        clarity: "",
        sideStoneShape: "",
        approxWeight: "",
        brandText: "",
      });
      setLogoPreview("");
      setLogoFileName("");
    } catch (error) {
      toast.error("Failed to submit design. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Design Details Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Design Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Design Number
                  </label>
                  <input
                    type="text"
                    name="designNumber"
                    value={formData.designNumber}
                    onChange={handleInputChange}
                    placeholder="Auto generated"
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Style
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Ring / Pendant / Stud</option>
                    <option value="Ring">Ring</option>
                    <option value="Pendant">Pendant</option>
                    <option value="Stud">Stud</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Necklace">Necklace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Gold Karat
                  </label>
                  <select
                    name="goldKarat"
                    value={formData.goldKarat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">14K / 18K / 22K</option>
                    <option value="14K">14K</option>
                    <option value="18K">18K</option>
                    <option value="22K">22K</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Approx Gold Weight
                  </label>
                  <input
                    type="text"
                    name="approxGoldWeight"
                    value={formData.approxGoldWeight}
                    onChange={handleInputChange}
                    placeholder="grams"
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Center Stone Details Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Center Stone Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Stone Type
                  </label>
                  <select
                    name="stoneType"
                    value={formData.stoneType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Diamond / Other</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Emerald">Emerald</option>
                    <option value="Ruby">Ruby</option>
                    <option value="Sapphire">Sapphire</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Diamond Shape
                  </label>
                  <select
                    name="diamondShape"
                    value={formData.diamondShape}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Round / Oval / Princess</option>
                    <option value="Round">Round</option>
                    <option value="Oval">Oval</option>
                    <option value="Princess">Princess</option>
                    <option value="Cushion">Cushion</option>
                    <option value="Emerald">Emerald</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Carat Weight
                  </label>
                  <input
                    type="text"
                    name="caratWeight"
                    value={formData.caratWeight}
                    onChange={handleInputChange}
                    placeholder="CT"
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Clarity
                  </label>
                  <select
                    name="clarity"
                    value={formData.clarity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">VVS / VS / SI</option>
                    <option value="IF">IF</option>
                    <option value="VVS1">VVS1</option>
                    <option value="VVS2">VVS2</option>
                    <option value="VS1">VS1</option>
                    <option value="VS2">VS2</option>
                    <option value="SI1">SI1</option>
                    <option value="SI2">SI2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Side Stone Details Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Side Stone Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Side Stone Shape
                  </label>
                  <select
                    name="sideStoneShape"
                    value={formData.sideStoneShape}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Shape</option>
                    <option value="Round">Round</option>
                    <option value="Baguette">Baguette</option>
                    <option value="Tapered">Tapered</option>
                    <option value="Princess">Princess</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Approx Weight
                  </label>
                  <input
                    type="text"
                    name="approxWeight"
                    value={formData.approxWeight}
                    onChange={handleInputChange}
                    placeholder="CT / MM"
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Branding & Marking Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Branding & Marking
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Stamping Details
                  </label>
                  <select
                    name="brandText"
                    value={formData.brandText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Brand text</option>
                    <option value="None">None</option>
                    <option value="Diamond Co">Diamond Co</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Upload Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-3 py-2 border border-input bg-card rounded text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer">
                      {logoFileName || "Choose file"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                onClick={handleReview}
                variant="outline"
                className="px-8"
              >
                Review
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 bg-accent text-accent-foreground hover:opacity-90"
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>

          {/* Review Modal */}
          {showReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-primary text-primary-foreground p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Review Your Details</h2>
                  <button
                    onClick={() => setShowReview(false)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Design Details Section */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-4">
                      Design Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Design Number
                        </label>
                        <input
                          type="text"
                          value={formData.designNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              designNumber: e.target.value,
                            })
                          }
                          placeholder="Auto generated"
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Style
                        </label>
                        <select
                          value={formData.style}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              style: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Style</option>
                          <option value="Ring">Ring</option>
                          <option value="Pendant">Pendant</option>
                          <option value="Stud">Stud</option>
                          <option value="Bracelet">Bracelet</option>
                          <option value="Necklace">Necklace</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Gold Karat
                        </label>
                        <select
                          value={formData.goldKarat}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              goldKarat: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Karat</option>
                          <option value="14K">14K</option>
                          <option value="18K">18K</option>
                          <option value="22K">22K</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Approx Gold Weight
                        </label>
                        <input
                          type="text"
                          value={formData.approxGoldWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              approxGoldWeight: e.target.value,
                            })
                          }
                          placeholder="grams"
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center Stone Details Section */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-4">
                      Center Stone Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Stone Type
                        </label>
                        <select
                          value={formData.stoneType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stoneType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Stone</option>
                          <option value="Diamond">Diamond</option>
                          <option value="Emerald">Emerald</option>
                          <option value="Ruby">Ruby</option>
                          <option value="Sapphire">Sapphire</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Diamond Shape
                        </label>
                        <select
                          value={formData.diamondShape}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              diamondShape: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Shape</option>
                          <option value="Round">Round</option>
                          <option value="Oval">Oval</option>
                          <option value="Princess">Princess</option>
                          <option value="Cushion">Cushion</option>
                          <option value="Emerald">Emerald</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Carat Weight
                        </label>
                        <input
                          type="text"
                          value={formData.caratWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              caratWeight: e.target.value,
                            })
                          }
                          placeholder="CT"
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Clarity
                        </label>
                        <select
                          value={formData.clarity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clarity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Clarity</option>
                          <option value="IF">IF</option>
                          <option value="VVS1">VVS1</option>
                          <option value="VVS2">VVS2</option>
                          <option value="VS1">VS1</option>
                          <option value="VS2">VS2</option>
                          <option value="SI1">SI1</option>
                          <option value="SI2">SI2</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Side Stone Details Section */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-4">
                      Side Stone Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Side Stone Shape
                        </label>
                        <select
                          value={formData.sideStoneShape}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sideStoneShape: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Shape</option>
                          <option value="Round">Round</option>
                          <option value="Baguette">Baguette</option>
                          <option value="Tapered">Tapered</option>
                          <option value="Princess">Princess</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Approx Weight
                        </label>
                        <input
                          type="text"
                          value={formData.approxWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              approxWeight: e.target.value,
                            })
                          }
                          placeholder="CT / MM"
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Branding & Marking Section */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-4">
                      Branding & Marking
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Stamping Details
                        </label>
                        <select
                          value={formData.brandText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brandText: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Brand</option>
                          <option value="None">None</option>
                          <option value="Diamond Co">Diamond Co</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Logo File
                        </label>
                        <div className="relative mb-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="px-3 py-2 border border-input bg-card rounded text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer">
                            {logoFileName || "Choose file"}
                          </div>
                        </div>
                        {logoPreview && !logoPreview.includes("File selected") && (
                          <div className="mt-3 p-3 bg-secondary rounded border border-input flex justify-center">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="max-h-32 max-w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-secondary border-t border-input p-6 flex gap-4 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowReview(false)}
                    variant="outline"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      setShowReview(false);
                      setLoading(true);
                      try {
                        const submitData: Record<string, string> = {};
                        Object.entries(formData).forEach(([key, value]) => {
                          if (key !== "logoFile" && value) {
                            submitData[key] = value;
                          }
                        });

                        if (logoFileName) {
                          submitData.logoFileName = logoFileName;
                        }

                        const response = await fetch("/api/designs", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(submitData),
                        });

                        if (!response.ok) throw new Error("Failed to submit");

                        toast.success("Design submitted successfully!");
                        setFormData({
                          designNumber: "",
                          style: "",
                          goldKarat: "",
                          approxGoldWeight: "",
                          stoneType: "",
                          diamondShape: "",
                          caratWeight: "",
                          clarity: "",
                          sideStoneShape: "",
                          approxWeight: "",
                          brandText: "",
                        });
                        setLogoPreview("");
                        setLogoFileName("");
                      } catch (error) {
                        toast.error("Failed to submit design. Please try again.");
                        console.error(error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="bg-accent text-accent-foreground hover:opacity-90 px-8"
                  >
                    {loading ? "Submitting..." : "Confirm & Submit"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
