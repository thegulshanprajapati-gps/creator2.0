'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash, Check, Loader2 } from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState(199);
  const [yearlyPrice, setYearlyPrice] = useState(1999);
  const [trialDays, setTrialDays] = useState(7);
  const [features, setFeatures] = useState("");
  const [badge, setBadge] = useState("");
  const [popular, setPopular] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/plans-crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/ /g, '-'),
          description,
          monthlyPrice,
          yearlyPrice,
          currency: 'INR',
          trialDays,
          features: features.split(',').map(f => f.trim()).filter(Boolean),
          badge,
          popular,
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Subscription plan created successfully!");
        setShowModal(false);
        fetchPlans();
      } else {
        alert(data.error || "Failed to create plan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePlan = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch('/api/admin/plans-crud', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: activeState })
      });
      if (res.ok) fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#FAFCFF] dark:bg-[#030712] min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">SaaS Subscription Plans</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configure active tiers, trial offsets, and feature list descriptions</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="bg-primary text-white gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card key={p.id} className={`rounded-[24px] border p-6 flex flex-col justify-between ${p.popular ? 'border-primary' : 'border-slate-200'}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{p.slug}</p>
                  </div>
                  <Badge className={p.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                    {p.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>

                <div className="py-2 border-y space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Monthly:</span>
                    <span>{p.monthlyPrice} INR</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Yearly:</span>
                    <span>{p.yearlyPrice} INR</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {(p.features || []).map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-450">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 flex gap-2">
                <Button 
                  onClick={() => handleTogglePlan(p.id, !p.isActive)}
                  variant="outline" 
                  className="w-full text-xs font-bold rounded-lg border-slate-200"
                >
                  {p.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <form 
            onSubmit={handleCreatePlan}
            className="w-full max-w-lg bg-white dark:bg-slate-950 border rounded-3xl p-6 shadow-2xl space-y-4 text-left"
          >
            <h3 className="text-lg font-bold">Create New Subscription Plan</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Name</span>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Plan" className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trial Days</span>
                  <input type="number" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</span>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short marketing details" className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Price</span>
                  <input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly Price</span>
                  <input type="number" value={yearlyPrice} onChange={(e) => setYearlyPrice(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Features (comma separated)</span>
                <textarea rows={2} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Unlimited Access, Mentorship Calls, Certificates..." className="w-full p-2.5 rounded-lg border bg-transparent text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promo Badge (Optional)</span>
                  <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. BEST VALUE" className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
                <label className="flex items-center gap-2.5 pt-6 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} />
                  <span>Highlight as Popular</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" onClick={() => setShowModal(false)} variant="ghost" className="h-9 px-4 text-xs font-bold rounded-lg">Cancel</Button>
              <Button type="submit" className="h-9 px-4 bg-primary text-white text-xs font-bold rounded-lg">Create Plan</Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
