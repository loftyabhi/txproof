import { Navbar } from '@/components/Navbar';

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            <Navbar />
            <div className="mx-auto max-w-4xl px-6 py-24 text-gray-300">
                <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
                <div className="space-y-6">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using Chain Receipt, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
                        <p>
                            Permission is granted to temporarily download one copy of the materials (information or software) on Chain Receipt's website for personal,
                            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>attempt to decompile or reverse engineer any software contained on Chain Receipt's website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Disclaimer</h2>
                        <p>
                            The materials on Chain Receipt's website are provided on an 'as is' basis. Chain Receipt makes no warranties, expressed or implied,
                            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability,
                            fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Limitations</h2>
                        <p>
                            In no event shall Chain Receipt or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit,
                            or due to business interruption) arising out of the use or inability to use the materials on Chain Receipt's website, even if Chain Receipt
                            or a Chain Receipt authorized representative has been notified orally or in writing of the possibility of such damage.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
