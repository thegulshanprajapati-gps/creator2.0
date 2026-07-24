'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Plug, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';

interface ConnectionStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'warning';
  service: string;
  description: string;
  config: string;
  envVars: string[];
  tips: string[];
  action?: string;
  latency?: number;
}

const connections: ConnectionStatus[] = [
  {
    name: 'MongoDB Atlas',
    status: 'disconnected',
    service: 'mongodb',
    description: 'Primary Document Database containing profiles, assessments, course structures, and system telemetry.',
    config: 'mongodb+srv://xmartydb.mongodb.net/Xmarty Creator',
    envVars: ['MONGODB_URI'],
    tips: [
      'Check MONGODB_URI starts with mongodb+srv://',
      'Ensure IP access list in MongoDB Atlas dashboard permits connection from your web host',
      'Verify user credentials inside the URI are correct',
    ],
  },
  {
    name: 'Supabase Engine',
    status: 'disconnected',
    service: 'supabase',
    description: 'Supplemental authentication and cloud relational database cluster.',
    config: 'https://sibaltmusbhcbelgtnli.supabase.co',
    envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    tips: [
      'Ensure NEXT_PUBLIC_SUPABASE_URL is correct',
      'Confirm NEXT_PUBLIC_SUPABASE_ANON_KEY matches your dashboard settings',
    ],
  },
  {
    name: 'Cloudinary CDN',
    status: 'disconnected',
    service: 'cloudinary',
    description: 'Cloud storage and dynamic delivery system for image uploads, PDF attachments, and video assets.',
    config: 'cloudinary://Xmarty Creator',
    envVars: ['NEXT_PUBLIC_CLOUDINARY_URL', 'NEXT_PUBLIC_CLOUDINARY_GALLERY_URL'],
    tips: [
      'Ensure NEXT_PUBLIC_CLOUDINARY_URL starts with cloudinary://',
      'Test image asset picking inside course editor',
    ],
  },
  {
    name: 'Firebase Services',
    status: 'disconnected',
    service: 'firebase',
    description: 'Legacy web app configuration for authentication state synchronizations.',
    config: 'firebase-config-json',
    envVars: ['NEXT_PUBLIC_FIREBASE_CONFIG'],
    tips: [
      'Used for backward compatibility auth logic',
      'Must contain a valid stringified JSON structure',
    ],
  },
  {
    name: 'Gemini AI Processor',
    status: 'disconnected',
    service: 'gemini',
    description: 'Advanced Large Language Model engine handling SEO suggestions and curriculum generation.',
    config: 'gemini-2.5-flash',
    envVars: ['GEMINI_API_KEY'],
    tips: [
      'Obtain API Key from Google AI Studio',
      'Ensure key is not restricted or expired',
    ],
  },
];

export default function ConnectionsPage() {
  const [statuses, setStatuses] = useState<ConnectionStatus[]>(connections);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const testConnection = async (service: string) => {
    setTesting(service);
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'connected') {
        setStatuses((prev) =>
          prev.map((s) =>
            s.service === service ? { ...s, status: 'connected', latency: data.latency } : s
          )
        );
      } else if (response.ok && data.status === 'warning') {
        setStatuses((prev) =>
          prev.map((s) =>
            s.service === service ? { ...s, status: 'warning', latency: data.latency } : s
          )
        );
      } else {
        setStatuses((prev) =>
          prev.map((s) =>
            s.service === service ? { ...s, status: 'disconnected', latency: undefined } : s
          )
        );
      }
    } catch (error) {
      setStatuses((prev) =>
        prev.map((s) =>
          s.service === service ? { ...s, status: 'disconnected', latency: undefined } : s
        )
      );
    } finally {
      setTesting(null);
      setLastUpdated(new Date());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Plug className="h-5 w-5" />;
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <h1 className="font-headline font-bold text-xl">Service Connections</h1>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-headline font-bold">Connection Hub</h2>
              <p className="text-muted-foreground mt-2">
                Manage and monitor connections to external services
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Last checked: {isMounted ? <span>{new Date(lastUpdated).toLocaleTimeString()}</span> : <span>—</span>}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  statuses.forEach((s) => testConnection(s.service));
                }}
                disabled={testing !== null}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Test All
              </Button>
            </div>
          </div>

          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Environment variables are loaded from <code className="bg-white/50 px-1 rounded">.env.local</code>. Changes require a server restart.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {statuses.map((connection) => (
              <Card key={connection.service} className="overflow-hidden">
                <CardHeader className={`${getStatusColor(connection.status)} border-b`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <CardDescription className="text-sm opacity-90">
                          {connection.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connection.latency !== undefined && (
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-white/20">
                          {connection.latency} ms
                        </Badge>
                      )}
                      <Badge
                        className="uppercase text-xs font-bold"
                        variant={
                          connection.status === 'connected'
                            ? 'default'
                            : connection.status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {connection.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Configuration</h3>
                    <div className="bg-muted p-3 rounded-lg text-sm font-mono text-muted-foreground break-all">
                      {connection.config}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-3">Environment Variables</h3>
                    <div className="space-y-2">
                      {connection.envVars.map((envVar) => (
                        <div key={envVar} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <code className="flex-1 text-xs font-mono">{envVar}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(envVar);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setShowSecrets((prev) => ({
                                ...prev,
                                [envVar]: !prev[envVar],
                              }));
                            }}
                          >
                            {showSecrets[envVar] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">Setup Tips</h3>
                    <ul className="space-y-1 text-sm">
                      {connection.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => testConnection(connection.service)}
                      disabled={testing === connection.service}
                    >
                      {testing === connection.service ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Plug className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    {connection.status === 'disconnected' && (
                      <Button size="sm" variant="outline">
                        View Setup Guide
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Quick Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">1. Update .env.local with your credentials</h4>
                <code className="block bg-white/50 p-3 rounded text-xs overflow-x-auto">
                  NEXT_PUBLIC_SUPABASE_URL=https://your-project.db.co
                  <br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
                </code>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">2. Restart your development server</h4>
                <p className="text-sm text-muted-foreground">
                  Run <code className="bg-white/50 px-2 py-1 rounded">npm run dev</code> to apply changes
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">3. Test the connection</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Test Connection" above to verify each service
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
