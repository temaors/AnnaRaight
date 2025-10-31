export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using this website, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Services Description</h2>
              <p className="text-gray-700 mb-4">
                Our website provides astrology education and consultation services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Personalized astrology consultations</li>
                <li>Birth chart analysis and interpretation</li>
                <li>Astrology learning and educational content</li>
                <li>Appointment scheduling for astrology sessions</li>
                <li>Astrological guidance and insights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Obligations</h2>
              <p className="text-gray-700 mb-4">
                As a user of our services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide accurate and truthful information</li>
                <li>Use our services for lawful purposes only</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to damage or disrupt our services</li>
                <li>Maintain confidentiality of any login credentials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Astrology Appointments and Consultations</h2>
              <p className="text-gray-700 mb-4">
                When scheduling astrology consultations:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>You must provide accurate contact information and birth details</li>
                <li>Cancellations should be made at least 24 hours in advance</li>
                <li>No-shows may result in restrictions on future astrology session bookings</li>
                <li>We reserve the right to reschedule astrology appointments if necessary</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Payment Terms</h2>
              <p className="text-gray-700 mb-4">
                For paid astrology services:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>All payments are processed securely through Stripe</li>
                <li>Refunds are subject to our refund policy</li>
                <li>Astrology session prices are subject to change with notice</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700">
                All content, including but not limited to text, graphics, logos, videos, and software, 
                is the property of our company or our content suppliers and is protected by copyright 
                and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Disclaimers</h2>
              <p className="text-gray-700 mb-4">
                Our services are provided on an &quot;as is&quot; basis. We make no warranties, expressed or implied, 
                and hereby disclaim all other warranties including, without limitation:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Implied warranties of merchantability</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement of intellectual property rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700">
                In no event shall our company be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the 
                use or inability to use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy, which also governs 
                your use of our services, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Termination</h2>
              <p className="text-gray-700">
                We reserve the right to terminate or suspend access to our services immediately, 
                without prior notice, for any reason whatsoever, including breach of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting on the website. Your continued use of the service after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms & Conditions, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>Company:</strong> AstroForYou<br />
                  <strong>Address:</strong> 56 Evesham Drive, Point Cook VIC 3030, Melbourne, Australia<br />
                  <strong>Email:</strong> hello@annaraight.com<br />
                  <strong>Website:</strong> annaraight.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Governing Law</h2>
              <p className="text-gray-700">
                These terms and conditions are governed by and construed in accordance with the laws 
                of Victoria, Australia.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}