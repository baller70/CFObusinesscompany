
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BankStatementUploader from '@/components/bank-statements/bank-statement-uploader';
import UploadHistory from '@/components/bank-statements/upload-history';

export default async function BankStatementsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-heading text-foreground mb-3">
            BANK STATEMENT PROCESSING
          </h1>
          <p className="text-body text-muted-foreground max-w-3xl">
            Upload your bank statements (CSV or PDF) and let our AI CFO automatically extract, categorize, and analyze your financial data. 
            The system will distribute transactions to appropriate categories and provide strategic insights.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-subheading text-foreground mb-6">
            UPLOAD STATEMENTS
          </h2>
          <BankStatementUploader />
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-subheading text-foreground mb-6">
            PROCESSING HISTORY
          </h2>
          <UploadHistory />
        </div>
      </div>
    </div>
  );
}
