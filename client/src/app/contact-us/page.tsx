import ContactForm from '@/components/ContactForm';
import { Navbar } from '@/components/Navbar';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactUs() {
    return (
        <main className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            <Navbar />
            <div className="mx-auto max-w-7xl px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <div className="space-y-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Get in touch with <br />
                            <span className="text-violet-500">Our Team</span>
                        </h1>
                        <p className="text-lg text-gray-400">
                            Have questions about Chain Receipt? Need help with your blockchain transactions?
                            We're here to help. Send us a message and we'll respond as soon as possible.
                        </p>

                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-violet-400">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email us at</p>
                                    <p className="font-medium text-white">sarkaritoolmail@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <ContactForm />
                    </div>

                </div>
            </div>
        </main>
    );
}
