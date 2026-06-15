'use client';

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Search, Star, ExternalLink, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function CommentsAdminPage() {
  const confirm = useConfirm();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs/comments');
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    if (typeof window !== 'undefined') {
      document.title = "Insight Comments Moderation | Support Console";
    }
  }, []);

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch('/api/blogs/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved: !currentApproved })
      });
      if (res.ok) {
        setComments(comments.map(c => c.id === id ? { ...c, approved: !currentApproved } : c));
      }
    } catch (e) {
      console.error('Failed to update comment status:', e);
    }
  };

  const handleDeleteComment = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Comment?",
      message: "Are you sure you want to permanently delete this comment? This action cannot be undone.",
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/blogs/comments?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete comment:', e);
    }
  };

  const filteredComments = comments.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.blogTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'approved' && c.approved !== false) || 
      (filterStatus === 'pending' && c.approved === false);

    return matchesSearch && matchesStatus;
  });

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-[#FAF9F6] dark:bg-[#030712] min-h-screen flex flex-col">
        {/* Header Bar */}
        <header className="border-b h-16 flex items-center px-6 justify-between shrink-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-headline font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              Insight Comments & Reviews Moderation
            </h2>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Comments</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{comments.length}</span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Approved Reviews</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {comments.filter(c => c.approved !== false).length}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500">
                  <Check className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Hidden / Suspended</span>
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
                    {comments.filter(c => c.approved === false).length}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtering and Search Controls */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Search and Filtering</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search comments by user, text, or blog article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus-visible:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="flex gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === 'all'
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === 'approved'
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-300"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === 'pending'
                      ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-300"
                  }`}
                >
                  Hidden
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List Grid / Table */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 text-center text-slate-500 text-sm font-medium">
                Loading comments...
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="py-24 text-center border border-dashed rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <MessageSquare className="h-10 w-10 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">No comments found</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Try adjusting your keywords or filter status to find what you are looking for.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredComments.map((commentVal: any) => (
                  <Card key={commentVal.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-3 flex-grow min-w-0">
                        {/* Title and Badge metadata */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{commentVal.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {commentVal.date ? new Date(commentVal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </span>
                          <Badge className={
                            commentVal.approved !== false 
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
                          }>
                            {commentVal.approved !== false ? "Visible" : "Hidden"}
                          </Badge>
                        </div>

                        {/* Stars Indicator */}
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < Number(commentVal.rating) ? "fill-amber-500 text-amber-500" : "text-slate-200 dark:text-slate-800"}`}
                            />
                          ))}
                        </div>

                        {/* Text */}
                        <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed italic">
                          "{commentVal.comment}"
                        </p>

                        {/* Associated Page Link */}
                        <div className="text-xs pt-1 border-t border-slate-100 dark:border-slate-900 flex items-center gap-1 text-slate-400">
                          <span>Target:</span>
                          <span className="font-semibold text-indigo-500">
                            {commentVal.blogTitle || "General Platform Review"}
                          </span>
                          {commentVal.blogId !== 'general' && (
                            <a
                              href={`/blog/${commentVal.blogSlug || commentVal.blogId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-500"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 md:self-center">
                        <Button
                          variant="outline"
                          onClick={() => handleToggleApproval(commentVal.id, commentVal.approved !== false)}
                          className={`h-10 px-4 rounded-xl font-semibold text-xs border ${
                            commentVal.approved !== false 
                              ? "border-amber-200 hover:bg-amber-50 dark:border-amber-900/40 dark:hover:bg-amber-950/30 text-amber-600"
                              : "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/40 dark:hover:bg-emerald-950/30 text-emerald-600"
                          }`}
                        >
                          {commentVal.approved !== false ? (
                            <>
                              <X className="h-3.5 w-3.5 mr-1" /> Hide Review
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteComment(commentVal.id)}
                          className="h-10 w-10 p-0 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
