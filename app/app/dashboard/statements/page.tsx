
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface BusinessProfile {
  id: string;
  name: string;
  type: string;
}

interface Statement {
  id: string;
  fileName: string;
  statementType: string;
  accountNumber: string | null;
  accountName: string | null;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
  status: string;
  createdAt: string;
  businessProfile?: BusinessProfile;
}

export default function StatementsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchBusinessProfiles();
      fetchStatements();
    }
  }, [status, router]);

  const fetchBusinessProfiles = async () => {
    try {
      const res = await fetch('/api/business-profiles');
      const data = await res.json();
      setBusinessProfiles(data.profiles || []);
      
      // Auto-select household/personal profile if exists
      const household = data.profiles?.find((p: BusinessProfile) => p.type === 'HOUSEHOLD');
      if (household) {
        setSelectedProfile(household.id);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bank-statements/status');
      const data = await res.json();
      setStatements(data.statements || []);
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (!selectedProfile) {
      toast.error('Please select a business or household profile first');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', file); // Note: API expects 'files' not 'file'
      formData.append('businessProfileId', selectedProfile);

      const res = await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Check if upload was successful
      const successfulUploads = data.uploads?.filter((u: any) => !u.error) || [];
      
      if (successfulUploads.length > 0) {
        toast.success(`Statement uploaded successfully! Processing...`);
        
        // Refresh statements list
        fetchStatements();
        
        // Navigate to review page with the first uploaded statement
        const firstUploadId = successfulUploads[0].id;
        if (firstUploadId) {
          setTimeout(() => {
            router.push(`/dashboard/statements/review?id=${firstUploadId}`);
          }, 1000);
        }
      } else {
        throw new Error(data.uploads?.[0]?.error || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload statement');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Imported';
      case 'PENDING':
        return 'Pending Review';
      default:
        return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bank Statements</h1>
        <p className="text-muted-foreground">
          Upload PDF bank statements to automatically import transactions
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Bank Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business / Household</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {businessProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.type === 'HOUSEHOLD' ? 'Personal' : 'Business'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose whether this statement belongs to your business or personal/household account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement-upload">PDF Statement File</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Input
                id="statement-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading || !selectedProfile}
                className="hidden"
              />
              <label
                htmlFor="statement-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {uploading ? 'Uploading and parsing...' : 'Click to upload PDF statement'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PNC Bank statements (Personal & Business)
                  </p>
                </div>
              </label>
            </div>
            {!selectedProfile && (
              <p className="text-sm text-destructive">
                Please select a business or household profile first
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Statements</CardTitle>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No statements uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your first bank statement to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>{getStatusIcon(statement.status)}</div>
                    <div>
                      <p className="font-medium">{statement.fileName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{statement.statementType} Account</span>
                        {statement.accountNumber && (
                          <>
                            <span>•</span>
                            <span>{statement.accountNumber}</span>
                          </>
                        )}
                        {statement.businessProfile && (
                          <>
                            <span>•</span>
                            <span>{statement.businessProfile.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{statement.transactionCount} transactions</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(statement.status)}
                    </span>
                    {statement.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/statements/review?id=${statement.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
