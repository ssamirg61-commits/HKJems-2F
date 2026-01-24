import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Trash2, RefreshCcw, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface SideStone {
  id: string;
  description: string;
  shape: string;
  weight: string;
}

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
  sideStones: SideStone[];
  marking: string;
  logoFileName?: string;
  mediaFileName?: string;
  createdAt: string;
}

export default function MyDesigns() {
  const { token } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDesigns = async () => {
    try {
      const res = await fetch("/api/designs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load designs");
      const data = await res.json();
      setDesigns(data);
    } catch (err) {
      toast.error("Failed to load designs");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) loadDesigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this design? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete design");
      toast.success("Design deleted");
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      toast.error("Failed to delete design");
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-secondary py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Designs</h1>
              <p className="text-muted-foreground text-sm mt-1">
                View and manage the designs you have submitted
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRefreshing(true);
                  loadDesigns();
                }}
                disabled={refreshing}
                className="flex items-center gap-2"
                title="Refresh"
              >
                <RefreshCcw size={16} /> {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Link to="/">
                <Button className="bg-accent text-accent-foreground hover:opacity-90 flex items-center gap-2">
                  <Plus size={16} /> New Design
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Loading your designs...</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-card rounded-lg p-12 text-center border border-input">
              <p className="text-muted-foreground mb-4">You haven't submitted any designs yet.</p>
              <Link to="/">
                <Button className="bg-accent text-accent-foreground hover:opacity-90">
                  Create your first design
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="bg-secondary border-b border-input">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Design #</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Style</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Gold</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Center Stone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Files</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Submitted</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-input">
                    {designs.map((d) => (
                      <tr key={d.id} className="hover:bg-secondary transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{d.designNumber}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{d.style} {d.clarity && (<span className="text-muted-foreground">({d.clarity})</span>)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{d.goldKarat} — {d.approxGoldWeight}g</td>
                        <td className="px-6 py-4 text-sm text-foreground">{d.stoneType} {d.diamondShape && (<span className="text-muted-foreground">/ {d.diamondShape}</span>)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-secondary border border-input">
                              {d.logoFileName || "-"}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-secondary border border-input">
                              {d.mediaFileName || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/my-designs/${d.id}`}>
                              <Button size="sm" variant="outline" className="px-2" title="View details">
                                <Eye size={16} />
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" className="px-2 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDelete(d.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
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
