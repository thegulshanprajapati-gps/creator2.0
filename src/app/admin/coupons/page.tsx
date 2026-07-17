'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Tag, Percent, Calendar } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<'Flat' | 'Percentage'>('Flat');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState(100);
  const [minimumOrder, setMinimumOrder] = useState(199);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiryDays, setExpiryDays] = useState(30);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons-crud');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const res = await fetch('/api/admin/coupons-crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().replace(/ /g, ''),
          description,
          discountType,
          discountValue,
          maxDiscount,
          minimumOrder,
          usageLimit,
          usedCount: 0,
          expiryDate,
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Coupon code created successfully!");
        setShowModal(false);
        setCode("");
        setDescription("");
        fetchCoupons();
      } else {
        alert(data.error || "Failed to create coupon");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCoupon = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch('/api/admin/coupons-crud', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: activeState })
      });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#FAFCFF] dark:bg-[#030712] min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">Coupon Codes Console</h1>
          <p className="text-xs text-slate-455 font-bold uppercase tracking-wider mt-1">Manage promotional campaigns, maximum cap margins, and usage limits</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="bg-primary text-white gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 font-medium text-center py-20">Loading coupon indexes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <Card key={c.id} className="rounded-[24px] border p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {c.discountType === 'Flat' ? <Tag className="h-4 w-4" /> : <Percent className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold tracking-wider uppercase text-slate-900 dark:text-white">{c.code}</h3>
                      <span className="text-[9px] text-slate-400 font-bold block">{c.discountType} discount</span>
                    </div>
                  </div>
                  <Badge className={c.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-550 border-slate-500/20"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{c.description}</p>

                <div className="py-2 border-y space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span>Discount Value:</span>
                    <span className="font-bold">{c.discountValue}{c.discountType === 'Flat' ? ' INR' : '%'}</span>
                  </div>
                  {c.discountType === 'Percentage' && (
                    <div className="flex justify-between">
                      <span>Max Discount limit:</span>
                      <span className="font-bold">{c.maxDiscount} INR</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Min Order value:</span>
                    <span className="font-bold">{c.minimumOrder} INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usages:</span>
                    <span className="font-bold">{c.usedCount} / {c.usageLimit || '∞'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" /> Expiry: {new Date(c.expiryDate).toLocaleDateString()}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={() => handleToggleCoupon(c.id, !c.isActive)}
                  variant="outline" 
                  className="w-full text-xs font-bold rounded-lg border-slate-200"
                >
                  {c.isActive ? "Disable" : "Enable"}
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
            onSubmit={handleCreateCoupon}
            className="w-full max-w-md bg-white dark:bg-slate-950 border rounded-3xl p-6 shadow-2xl space-y-4 text-left"
          >
            <h3 className="text-lg font-bold">Create Coupon Campaign</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coupon Code</span>
                  <input required type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVEMORE" className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs font-bold uppercase" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Period (Days)</span>
                  <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign Description</span>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Get 15% discount on all memberships" className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discount Type</span>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs">
                    <option value="Flat">Flat Discount</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discount Value</span>
                  <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max Cap (INR)</span>
                  <input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min Order (INR)</span>
                  <input type="number" value={minimumOrder} onChange={(e) => setMinimumOrder(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Usage Limit</span>
                  <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))} className="w-full h-9 px-3 rounded-lg border bg-transparent text-xs" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" onClick={() => setShowModal(false)} variant="ghost" className="h-9 px-4 text-xs font-bold rounded-lg">Cancel</Button>
              <Button type="submit" className="h-9 px-4 bg-primary text-white text-xs font-bold rounded-lg">Create Code</Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
