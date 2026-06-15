'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Trash2, Heart, Plus, Send } from "lucide-react";

export default function CommunityAdminPage() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Post fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/dashboard/community');
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !content) {
      toast({ variant: "destructive", title: "Validation Error", description: "All fields are required" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, content })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Post Created", description: "New discussion successfully started." });
        setTitle('');
        setAuthor('');
        setContent('');
        fetchPosts();
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Discussion",
      message: "Are you sure you want to delete this community discussion? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/dashboard/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: "Discussion thread removed successfully." });
        fetchPosts();
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Hub Interactions</h1>
            <p className="text-xs text-muted-foreground font-medium">Community discussions, comments, and post moderation</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Post Creation Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-primary/10 shadow-lg rounded-[2rem] bg-background">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Start Discussion
                </CardTitle>
                <CardDescription>Publish a new discussion thread onto the community board.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="author-name">Your Name</Label>
                    <Input 
                      id="author-name" 
                      value={author} 
                      onChange={(e) => setAuthor(e.target.value)} 
                      placeholder="Admin username"
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-title">Thread Title</Label>
                    <Input 
                      id="post-title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Topic heading"
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-content">Message Content</Label>
                    <Textarea 
                      id="post-content" 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)} 
                      placeholder="Write discussion body here..."
                      rows={5}
                      className="rounded-xl resize-none"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Publish Thread</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Posts Feed List */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 ml-1">
              <MessageSquare className="h-4.5 w-4.5 text-primary" /> Active Discussions ({posts.length})
            </h2>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="border-dashed border-2 p-12 text-center text-muted-foreground rounded-[2rem]">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20 animate-bounce" />
                <p className="font-bold">No discussions found</p>
                <p className="text-xs mt-1">Start your first discussion using the left panel.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="border-primary/10 shadow-md rounded-[2rem] bg-background hover:border-primary/30 transition-colors">
                    <CardHeader className="p-6 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{post.author}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="font-headline text-lg text-primary">{post.title}</CardTitle>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer select-none">
                          <Heart className="h-4 w-4" /> {post.likes} Likes
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer select-none">
                          <MessageSquare className="h-4 w-4" /> {post.replies} Replies
                        </span>
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
