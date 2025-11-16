import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using WhaSales AI ("the Service"), you accept and agree to be bound
                by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                WhaSales AI provides AI-powered automation for WhatsApp Business messaging. The Service
                includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>WhatsApp integration via QR code scanning</li>
                <li>AI-powered automatic responses</li>
                <li>Conversation management and analytics</li>
                <li>Knowledge base and template management</li>
                <li>Multi-agent support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activity under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree NOT to use the Service to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Send spam or unsolicited messages</li>
                <li>Violate WhatsApp's Terms of Service or Business Policy</li>
                <li>Harass, abuse, or harm others</li>
                <li>Distribute malware or malicious content</li>
                <li>Engage in illegal activities</li>
                <li>Impersonate others or provide false information</li>
                <li>Scrape or collect data without permission</li>
                <li>Interfere with the Service's operation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. WhatsApp Compliance</h2>
              <p className="text-gray-700 mb-4">
                You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You must comply with WhatsApp's Terms of Service</li>
                <li>WhatsApp may ban numbers that violate their policies</li>
                <li>We are not responsible for WhatsApp account bans</li>
                <li>You should only message users who have opted in to receive messages</li>
                <li>Customers must message you first (opt-in)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Subscription and Payments</h2>
              <p className="text-gray-700 mb-4">
                <strong>Free Trial:</strong> New users receive a 3-day free trial with full access to features.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Paid Plans:</strong> After the trial, you must subscribe to continue using the Service.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Billing:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Monthly subscriptions renew automatically</li>
                <li>Yearly subscriptions renew annually</li>
                <li>Lifetime plans are one-time payments with no recurring fees</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change prices with 30 days' notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Cancellation and Refunds</h2>
              <p className="text-gray-700 mb-4">
                <strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues
                until the end of your billing period.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Refunds:</strong> We do not provide refunds for partial months or unused messages.
                Lifetime plans are non-refundable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                We strive for 99.9% uptime but do not guarantee uninterrupted service. We may:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Perform scheduled maintenance</li>
                <li>Make updates and improvements</li>
                <li>Experience unexpected downtime</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We are not liable for service interruptions or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service, including all content, features, and functionality, is owned by WhaSales AI
                and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 mb-4">
                You retain ownership of your data but grant us a license to process it to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your use of the Service is also governed by our Privacy Policy. We collect and process
                your data as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We provide the Service "as is" without warranties</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid in the last 12 months</li>
                <li>We are not responsible for third-party services (WhatsApp, AI providers, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless WhaSales AI from any claims, damages, or expenses
                arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Violate these Terms</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent activity</li>
                <li>Abuse the Service</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Upon termination, you lose access to your account and data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may modify these Terms at any time. We will notify you of significant changes.
                Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">15. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by and construed in accordance with applicable laws.
                Any disputes will be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">16. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms, contact us at:
              </p>
              <p className="text-gray-700 mb-2">
                Email: <a href="mailto:support@whasalesai.com" className="text-primary hover:underline">
                  support@whasalesai.com
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
