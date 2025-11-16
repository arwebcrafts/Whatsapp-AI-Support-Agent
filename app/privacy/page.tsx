import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">WhaSales AI</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to WhaSales AI ("we," "our," or "us"). We are committed to protecting your
                personal information and your right to privacy. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect information that you provide directly to us:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password</li>
                <li><strong>WhatsApp Messages:</strong> Messages sent and received through our platform</li>
                <li><strong>Business Information:</strong> Knowledge base content you upload</li>
                <li><strong>Usage Data:</strong> Analytics about how you use our service</li>
                <li><strong>Payment Information:</strong> Processed securely through our payment providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide and maintain our AI-powered WhatsApp automation service</li>
                <li>Process your WhatsApp messages with AI responses</li>
                <li>Send you service updates and support communications</li>
                <li>Improve and optimize our service</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your
                personal information. Your WhatsApp session data is encrypted and stored securely. However,
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing</h2>
              <p className="text-gray-700 mb-4">We do not sell your personal information. We may share your data with:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>AI Service Providers:</strong> To process messages (e.g., OpenAI, Anthropic)</li>
                <li><strong>Payment Processors:</strong> To handle subscription payments</li>
                <li><strong>Hosting Providers:</strong> To store and serve your data</li>
                <li><strong>Legal Authorities:</strong> When required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Cancel your subscription at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as your account is active or as needed to provide
                services. You can request deletion of your account and all associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to improve your experience, analyze usage,
                and maintain your session. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 18 years of age. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any significant
                changes by email or through our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 mb-2">
                Email: <a href="mailto:privacy@whasalesai.com" className="text-primary hover:underline">
                  privacy@whasalesai.com
                </a>
              </p>
              <p className="text-gray-700">
                Developed by:{" "}
                <a
                  href="https://arwebcrafts.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  AR Web Crafts
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">&copy; 2025 WhaSales AI. All rights reserved.</p>
          <p className="text-sm mt-2">
            Powered by{" "}
            <a
              href="https://arwebcrafts.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              AR Web Crafts
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
