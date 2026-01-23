import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";

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
  marking: string;
  logoFile?: File;
  mediaFile?: File;
}

interface ValidationErrors {
  [key: string]: string;
}

const REQUIRED_TEXT_FIELDS = [
  "designNumber",
  "approxGoldWeight",
  "caratWeight",
  "approxWeight",
  "marking",
];
const REQUIRED_DROPDOWN_FIELDS = [
  "style",
  "goldKarat",
  "stoneType",
  "diamondShape",
  "clarity",
  "sideStoneShape",
];
const REQUIRED_FILE_FIELDS = ["logoFile", "mediaFile"];

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
    marking: "",
  });

  const [logoFileName, setLogoFileName] = useState("");
  const [mediaFileName, setMediaFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<FormData>(
    formData,
  );

  const validateForm = (data: FormData, checkFiles = true): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate text fields
    REQUIRED_TEXT_FIELDS.forEach((field) => {
      const value = data[field as keyof FormData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field] = `${field === "marking" ? "Marking" : field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} is required`;
      }
    });

    // Validate marking field length
    if (data.marking && data.marking.length > 50) {
      errors.marking = "Marking must not exceed 50 characters";
    }

    // Validate dropdowns (empty string is invalid)
    REQUIRED_DROPDOWN_FIELDS.forEach((field) => {
      const value = data[field as keyof FormData];
      if (!value || value === "") {
        errors[field] = `Please select a ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`;
      }
    });

    // Validate files only during final submission
    if (checkFiles) {
      REQUIRED_FILE_FIELDS.forEach((field) => {
        if (field === "logoFile" && !logoFileName) {
          errors[field] = "Logo file is required";
        }
        if (field === "mediaFile" && !mediaFileName) {
          errors[field] = "Media file is required";
        }
      });
    }

    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Handle textarea length limit
    if (name === "marking" && value.length > 50) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsFormDirty(true);

    // Real-time validation
    const errors = validateForm(
      { ...formData, [name]: value },
      false,
    );
    const newErrors = { ...validationErrors };

    if (errors[name]) {
      newErrors[name] = errors[name];
    } else {
      delete newErrors[name];
    }

    setValidationErrors(newErrors);
  };

  const handleLogoFileChange = (file: File | null) => {
    if (!file) {
      setLogoFileName("");
      setLogoPreview("");
      return;
    }

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setValidationErrors((prev) => ({
        ...prev,
        logoFile: "Only PNG, JPEG, and JPG formats are allowed",
      }));
      return;
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        logoFile: "Logo file must not exceed 10 MB",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, logoFile: file }));
    setLogoFileName(file.name);
    setIsFormDirty(true);

    // Clear error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.logoFile;
      return newErrors;
    });

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaFileChange = (file: File | null) => {
    if (!file) {
      setMediaFileName("");
      return;
    }

    // Validate file type
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    const isValidType =
      validImageTypes.includes(file.type) ||
      validVideoTypes.includes(file.type);

    if (!isValidType) {
      setValidationErrors((prev) => ({
        ...prev,
        mediaFile: "Only image and video formats are allowed",
      }));
      return;
    }

    // Validate file size (100 MB)
    if (file.size > 100 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        mediaFile: "Media file must not exceed 100 MB",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, mediaFile: file }));
    setMediaFileName(file.name);
    setIsFormDirty(true);

    // Clear error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.mediaFile;
      return newErrors;
    });
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isLogo: boolean,
  ) => {
    const file = e.target.files?.[0];
    if (isLogo) {
      handleLogoFileChange(file || null);
    } else {
      handleMediaFileChange(file || null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent,
    isLogo: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (isLogo) {
      handleLogoFileChange(file || null);
    } else {
      handleMediaFileChange(file || null);
    }
  };

  const focusFirstError = () => {
    const errorFields = Object.keys(validationErrors);
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      const element = document.querySelector(
        `[name="${firstErrorField}"], [data-error-field="${firstErrorField}"]`,
      ) as HTMLElement;
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleReview = () => {
    const errors = validateForm(formData, false);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError();
      toast.error("Please fix validation errors before reviewing");
      return;
    }

    setShowReview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full validation including files
    const errors = validateForm(formData, true);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError();
      toast.error("Please fix all validation errors");
      return;
    }

    setLoading(true);

    try {
      // Convert files to base64
      let logoDataUrl = logoPreview;
      let mediaDataUrl = "";

      if (formData.mediaFile) {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onloadend = () => {
            mediaDataUrl = reader.result as string;
            resolve(null);
          };
          reader.readAsDataURL(formData.mediaFile);
        });
      }

      const submitData: Record<string, string> = {};

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "logoFile" && key !== "mediaFile" && value) {
          submitData[key] = value as string;
        }
      });

      // Add file metadata and base64 data
      if (logoFileName) {
        submitData.logoFileName = logoFileName;
      }
      if (logoDataUrl && logoDataUrl.startsWith("data:")) {
        submitData.logoData = logoDataUrl;
      }
      if (mediaFileName) {
        submitData.mediaFileName = mediaFileName;
      }
      if (mediaDataUrl) {
        submitData.mediaData = mediaDataUrl;
      }

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors && Array.isArray(errorData.errors)
            ? errorData.errors.join(", ")
            : errorData.error || "Failed to submit";
        throw new Error(errorMessage);
      }

      toast.success("Design submitted successfully!");

      // Reset form
      const resetData: FormData = {
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
        marking: "",
      };
      setFormData(resetData);
      setOriginalFormData(resetData);
      setLogoPreview("");
      setLogoFileName("");
      setMediaFileName("");
      setValidationErrors({});
      setIsFormDirty(false);
      setShowReview(false);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit design";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isReviewDisabled = !isFormDirty;

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
                    Design Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="designNumber"
                    value={formData.designNumber}
                    onChange={handleInputChange}
                    placeholder="Auto generated"
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.designNumber
                        ? "border-red-500"
                        : "border-input"
                    }`}
                    data-error-field="designNumber"
                  />
                  {validationErrors.designNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.designNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Style <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.style ? "border-red-500" : "border-input"
                    }`}
                  >
                    <option value="">Select Style</option>
                    <option value="Ring">Ring</option>
                    <option value="Pendant">Pendant</option>
                    <option value="Stud">Stud</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Necklace">Necklace</option>
                  </select>
                  {validationErrors.style && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.style}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Gold Karat <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="goldKarat"
                    value={formData.goldKarat}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.goldKarat
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  >
                    <option value="">Select Karat</option>
                    <option value="14K">14K</option>
                    <option value="18K">18K</option>
                    <option value="22K">22K</option>
                  </select>
                  {validationErrors.goldKarat && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.goldKarat}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Approx Gold Weight <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="approxGoldWeight"
                    value={formData.approxGoldWeight}
                    onChange={handleInputChange}
                    placeholder="grams"
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.approxGoldWeight
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  />
                  {validationErrors.approxGoldWeight && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.approxGoldWeight}
                    </p>
                  )}
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
                    Stone Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="stoneType"
                    value={formData.stoneType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.stoneType
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  >
                    <option value="">Select Stone Type</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Emerald">Emerald</option>
                    <option value="Ruby">Ruby</option>
                    <option value="Sapphire">Sapphire</option>
                    <option value="Other">Other</option>
                  </select>
                  {validationErrors.stoneType && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.stoneType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Diamond Shape <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="diamondShape"
                    value={formData.diamondShape}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.diamondShape
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  >
                    <option value="">Select Diamond Shape</option>
                    <option value="Round">Round</option>
                    <option value="Oval">Oval</option>
                    <option value="Princess">Princess</option>
                    <option value="Cushion">Cushion</option>
                    <option value="Emerald">Emerald</option>
                  </select>
                  {validationErrors.diamondShape && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.diamondShape}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Carat Weight <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="caratWeight"
                    value={formData.caratWeight}
                    onChange={handleInputChange}
                    placeholder="CT"
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.caratWeight
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  />
                  {validationErrors.caratWeight && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.caratWeight}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Clarity <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clarity"
                    value={formData.clarity}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.clarity
                        ? "border-red-500"
                        : "border-input"
                    }`}
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
                  {validationErrors.clarity && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.clarity}
                    </p>
                  )}
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
                    Side Stone Shape <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sideStoneShape"
                    value={formData.sideStoneShape}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.sideStoneShape
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  >
                    <option value="">Select Shape</option>
                    <option value="Round">Round</option>
                    <option value="Baguette">Baguette</option>
                    <option value="Tapered">Tapered</option>
                    <option value="Princess">Princess</option>
                  </select>
                  {validationErrors.sideStoneShape && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.sideStoneShape}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Approx Weight <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="approxWeight"
                    value={formData.approxWeight}
                    onChange={handleInputChange}
                    placeholder="CT / MM"
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                      validationErrors.approxWeight
                        ? "border-red-500"
                        : "border-input"
                    }`}
                  />
                  {validationErrors.approxWeight && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.approxWeight}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Marking & Stamping Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Marking & Stamping
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Marking <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-start gap-2">
                    <textarea
                      name="marking"
                      value={formData.marking}
                      onChange={handleInputChange}
                      placeholder="Enter marking details (max 50 characters)"
                      maxLength={50}
                      className={`flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card resize-none ${
                        validationErrors.marking
                          ? "border-red-500"
                          : "border-input"
                      }`}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-between items-start mt-2">
                    <div>
                      {validationErrors.marking && (
                        <p className="text-red-500 text-xs">
                          {validationErrors.marking}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.marking.length}/50
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Logo Upload <span className="text-red-500">*</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, true)}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      validationErrors.logoFile
                        ? "border-red-500 bg-red-50/10"
                        : "border-input hover:border-accent bg-secondary"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileInputChange(e, true)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload size={24} className="text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Click to upload
                        </span>
                        {" or drag and drop"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPEG, JPG up to 10 MB
                      </p>
                    </label>
                  </div>
                  {logoFileName && (
                    <div className="mt-3 p-3 bg-secondary rounded border border-input flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        {logoFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLogoFileChange(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {logoPreview && logoPreview.startsWith("data:") && (
                    <div className="mt-3 p-3 bg-secondary rounded border border-input flex justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  )}
                  {validationErrors.logoFile && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.logoFile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Media Upload (Images/Videos){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, false)}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      validationErrors.mediaFile
                        ? "border-red-500 bg-red-50/10"
                        : "border-input hover:border-accent bg-secondary"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileInputChange(e, false)}
                      className="hidden"
                      id="media-upload"
                    />
                    <label
                      htmlFor="media-upload"
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload size={24} className="text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Click to upload
                        </span>
                        {" or drag and drop"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Images (PNG, JPEG, GIF, WebP) or Videos (MP4, MOV,
                        AVI, WebM) up to 100 MB
                      </p>
                    </label>
                  </div>
                  {mediaFileName && (
                    <div className="mt-3 p-3 bg-secondary rounded border border-input flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        {mediaFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMediaFileChange(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {validationErrors.mediaFile && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.mediaFile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                onClick={handleReview}
                disabled={isReviewDisabled}
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
                        <p className="text-foreground">{formData.designNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Style
                        </label>
                        <p className="text-foreground">{formData.style}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Gold Karat
                        </label>
                        <p className="text-foreground">{formData.goldKarat}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Approx Gold Weight
                        </label>
                        <p className="text-foreground">
                          {formData.approxGoldWeight}
                        </p>
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
                        <p className="text-foreground">{formData.stoneType}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Diamond Shape
                        </label>
                        <p className="text-foreground">
                          {formData.diamondShape}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Carat Weight
                        </label>
                        <p className="text-foreground">{formData.caratWeight}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Clarity
                        </label>
                        <p className="text-foreground">{formData.clarity}</p>
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
                        <p className="text-foreground">
                          {formData.sideStoneShape}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Approx Weight
                        </label>
                        <p className="text-foreground">{formData.approxWeight}</p>
                      </div>
                    </div>
                  </div>

                  {/* Marking & Stamping Section */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-4">
                      Marking & Stamping
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Marking
                        </label>
                        <p className="text-foreground whitespace-pre-wrap">
                          {formData.marking}
                        </p>
                      </div>
                      {logoPreview && (
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">
                            Logo
                          </label>
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-h-32 max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  {mediaFileName && (
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-4">
                        Media
                      </h3>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          File
                        </label>
                        <p className="text-foreground">{mediaFileName}</p>
                      </div>
                    </div>
                  )}
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
                    onClick={handleSubmit}
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
