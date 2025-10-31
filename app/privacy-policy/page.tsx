export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Fill out our astrology consultation request forms</li>
                <li>Schedule astrology consultation appointments</li>
                <li>Subscribe to our astrology learning communications</li>
                <li>Contact us for astrology support and guidance</li>
              </ul>
              <p className="text-gray-700">
                This information may include your name, email address, phone number, birth information, and astrology learning goals.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide and improve our astrology education services</li>
                <li>Send you personalized astrology learning content</li>
                <li>Schedule and manage astrology consultation appointments</li>
                <li>Send astrology course and certification communications (with your consent)</li>
                <li>Respond to your astrology-related inquiries</li>
                <li>Analyze usage patterns to improve our astrology learning website</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy. We may share your information with trusted service providers who assist 
                us in operating our astrology education website and conducting our astrology certification programs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience on our website. 
                This includes analytics cookies and marketing pixels (such as Facebook Pixel) to improve our services 
                and provide relevant advertising.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Email Communications</h2>
              <p className="text-gray-700">
                You may opt out of receiving marketing emails from us by clicking the unsubscribe link in any email 
                or contacting us directly. Please note that you may still receive transactional emails related to 
                your appointments or service requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:
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
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the effective date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}