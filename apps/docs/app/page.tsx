import { CodeBlock } from "@/components/ui/CodeBlock";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Metadata } from 'next';
import { constructCanonical, generateBreadcrumbSchema, generateTechArticleSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: 'Introduction',
  description: 'Welcome to the TxProof API docs. Learn how the TxProof engine transforms raw hex data into professional on-chain receipts.',
  alternates: {
    canonical: constructCanonical('/'),
  },
};

const breadcrumbs = [
  { name: "Docs", item: "/" },
  { name: "Introduction", item: "/" },
];

const schema = generateTechArticleSchema(
  'Introduction to TxProof API',
  'Comprehensive overview of the TxProof verifiable on-chain receipt engine.',
  '/'
);

export default function Introduction() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Introduction</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Welcome to the TxProof API developer documentation.
          Our API allows you to programmatically generate verifiable receipts for on-chain transactions across multiple blockchains.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/quick-start" className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors group bg-card">
          <h3 className="font-semibold text-lg mb-2 flex items-center">
            Quick Start
            <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-muted-foreground text-sm">Get up and running with your first receipt generation in minutes.</p>
        </Link>
        <Link href="/developer-console" className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors group bg-card border-primary/20 bg-primary/5">
          <h3 className="font-semibold text-lg mb-2 flex items-center">
            Developer Console
            <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-muted-foreground text-sm">Manage your account, verify your email, and issue API keys.</p>
        </Link>
        <Link href="/reference" className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors group bg-card">
          <h3 className="font-semibold text-lg mb-2 flex items-center">
            API Reference
            <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-muted-foreground text-sm">Explore specific endpoints, parameters, and response types.</p>
        </Link>
      </div>

      <section className="space-y-6 pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">How it Works</h2>
        <p className="text-muted-foreground">
          The TxProof API uses an asynchronous <strong>soft-queue model</strong> to handle receipt generation for high-reliability and performance.
          Generating a PDF receipt from blockchain data can be resource-intensive, so we process these requests in the background.
        </p>

        <div className="bg-muted/30 p-6 rounded-xl border border-border/50 space-y-4">
          <h4 className="font-medium text-foreground">The Lifecycle</h4>
          <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
            <li>
              <strong>Request:</strong> You request a receipt for a transaction hash.
              <div className="mt-1 text-xs bg-muted p-2 rounded border border-border/50">POST /api/v1/bills/resolve</div>
            </li>
            <li>
              <strong>Queue:</strong> We return a <StatusBadge status="pending" /> job ID immediately.
              <div className="mt-1 text-xs">{"{ job_id: 'job_123', status: 'pending' }"}</div>
            </li>
            <li><strong>Process:</strong> Our workers fetch chain data, resolve metadata, and generate the PDF. Status becomes <StatusBadge status="processing" />.</li>
            <li><strong>Complete:</strong> The job status updates to <StatusBadge status="completed" /> and the PDF URL is available.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Polling & Caching</h2>
        <p className="text-muted-foreground">
          Since generation is async, you should implement <strong>polling</strong> to check the job status.
          We recommend polling every <strong>2-5 seconds</strong> via the <code className="text-xs bg-muted px-1 py-0.5 rounded">GET /api/v1/bills/job/:jobId</code> endpoint.
        </p>
        <p className="text-muted-foreground">
          Once generated, receipts are <strong>cached permanently</strong> (or for a long duration).
          Subsequent requests for the same transaction hash will return the completed job immediately.
        </p>
      </section>
    </div>
  );
}
