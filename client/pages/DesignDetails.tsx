import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

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

export default function DesignDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/designs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load designs");
        const list: Design[] = await res.json();
        const found = list.find((d) => d.id === id);
        if (!found) {
          toast.error("Design not found or access denied");
        }
        setDesign(found || null);
      } catch (err) {
        toast.error("Failed to load design");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token && id) load();
  }, [token, id]);

  return (
    <Layout>
      <div className="min-h-screen bg-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/my-designs">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Back to My Designs
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Loading design...</p>
            </div>
          ) : !design ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Design not found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-6">Design #{design.designNumber}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Style</p>
                    <p className="text-foreground">{design.style}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gold</p>
                    <p className="text-foreground">{design.goldKarat} — {design.approxGoldWeight}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Center Stone</p>
                    <p className="text-foreground">{design.stoneType}{design.diamondShape ? ` / ${design.diamondShape}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Carat Weight</p>
                    <p className="text-foreground">{design.caratWeight}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clarity</p>
                    <p className="text-foreground">{design.clarity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-foreground">{new Date(design.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-md font-semibold text-foreground mb-4">Side Stones</h3>
                {design.sideStones && design.sideStones.length > 0 ? (
                  <div className="space-y-3">
                    {design.sideStones.map((s, idx) => (
                      <div key={s.id} className="border border-input rounded p-3 bg-secondary">
                        <p className="text-sm text-foreground font-medium mb-2">Side Stone {idx + 1}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Description</p>
                            <p className="text-foreground">{s.description || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Shape</p>
                            <p className="text-foreground">{s.shape || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Weight</p>
                            <p className="text-foreground">{s.weight || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No side stones</p>
                )}
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-md font-semibold text-foreground mb-4">Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="border border-input rounded p-3 bg-secondary">
                    <p className="text-muted-foreground text-xs mb-1">Logo</p>
                    <p className="text-foreground break-all">{design.logoFileName || '-'}</p>
                  </div>
                  <div className="border border-input rounded p-3 bg-secondary">
                    <p className="text-muted-foreground text-xs mb-1">Media</p>
                    <p className="text-foreground break-all">{design.mediaFileName || '-'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Downloads are not available in this demo build.</p>
              </div>

              <div className="flex justify-end">
                <Link to="/my-designs">
                  <Button variant="outline">Back</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
