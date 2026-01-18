import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Edit2, Download } from "lucide-react";

interface Design {
  id: string;
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
  logoFileName?: string;
  logoData?: string;
  createdAt: string;
}

interface EditingDesign {
  id: string;
  [key: string]: string;
}

export default function Admin() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingDesign | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const response = await fetch("/api/designs");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setDesigns(data);
    } catch (error) {
      toast.error("Failed to load designs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (design: Design) => {
    setEditingId(design.id);
    const { id, logoData, createdAt, ...editableFields } = design;
    setEditingData({ id, ...editableFields });
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    try {
      const response = await fetch(`/api/designs/${editingData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Design updated successfully");
      setEditingId(null);
      setEditingData(null);
      fetchDesigns();
    } catch (error) {
      toast.error("Failed to update design");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return;

    try {
      const response = await fetch(`/api/designs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Design deleted successfully");
      setDesigns(designs.filter((d) => d.id !== id));
    } catch (error) {
      toast.error("Failed to delete design");
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/designs/export");
      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jewelry-designs-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Designs exported successfully");
    } catch (error) {
      toast.error("Failed to export designs");
      console.error(error);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    if (editingData) {
      setEditingData({ ...editingData, [field]: value });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading designs...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-secondary py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
            <Button
              onClick={handleExport}
              className="bg-accent text-accent-foreground hover:opacity-90 flex items-center gap-2"
            >
              <Download size={18} />
              Export to Excel
            </Button>
          </div>

          {designs.length === 0 ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                No designs submitted yet.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="bg-secondary border-b border-input">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Design #
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Style
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Gold Karat
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Stone Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Clarity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-input">
                    {designs.map((design) => (
                      <tr key={design.id} className="hover:bg-secondary transition-colors">
                        {editingId === design.id ? (
                          <>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-4 bg-secondary p-6 rounded max-h-96 overflow-y-auto">
                                <h3 className="font-semibold text-foreground mb-4">Edit Design Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {Object.entries(editingData || {}).map(
                                    ([key, value]) =>
                                      key !== "id" && key !== "logoData" && (
                                        <div key={key}>
                                          <label className="block text-sm font-medium text-foreground mb-2">
                                            {key
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (c) => c.toUpperCase())}
                                          </label>
                                          <input
                                            type="text"
                                            value={value || ""}
                                            onChange={(e) =>
                                              handleEditChange(key, e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                          />
                                        </div>
                                      )
                                  )}
                                </div>
                                {design.logoData && (
                                  <div className="mt-4 p-4 bg-card rounded border border-input">
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                      Logo Preview
                                    </label>
                                    <img
                                      src={design.logoData}
                                      alt="Logo preview"
                                      className="max-h-40 max-w-full object-contain"
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2 justify-end pt-4 border-t border-input">
                                  <Button
                                    onClick={() => setEditingId(null)}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSaveEdit}
                                    className="bg-accent text-accent-foreground hover:opacity-90"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {design.designNumber || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {design.style}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {design.goldKarat}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {design.stoneType}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {design.clarity}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(design.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleEdit(design)}
                                  size="sm"
                                  variant="outline"
                                  className="px-2"
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(design.id)}
                                  size="sm"
                                  variant="outline"
                                  className="px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
