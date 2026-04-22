import { X, Shield, Monitor, FileText } from "lucide-react";
import "./InfoModal.css";

const MODAL_CONTENT = {
  terms: {
    title: "Terms of Use",
    icon: <FileText size={18} />,
    body: (
      <>
        <strong>Wealth Management Platform - Terms of Use</strong>
        <p className="mt-3">
          By accessing and using this Wealth Management Platform, you agree to be bound by these Terms of Use.
          Please read them carefully before proceeding.
        </p>
        <p className="mt-2">
          <strong>1. Acceptance of Terms</strong><br />
          By using this platform, you acknowledge that you have read, understood, and agree to be bound by these terms
          and all applicable laws and regulations.
        </p>
        <p className="mt-2">
          <strong>2. Use of Service</strong><br />
          This platform is designed for wealth management professionals to manage client portfolios, analyze investments,
          and provide financial advisory services. You agree to use the service only for lawful purposes.
        </p>
        <p className="mt-2">
          <strong>3. User Responsibilities</strong><br />
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account. You must notify us immediately of any unauthorized use.
        </p>
        <p className="mt-2">
          <strong>4. Data Security</strong><br />
          We implement industry-standard security measures to protect your data. However, you acknowledge that no
          method of transmission over the internet is 100% secure.
        </p>
        <p className="mt-2">
          <strong>5. Intellectual Property</strong><br />
          All content, features, and functionality of this platform are owned by us and are protected by international
          copyright, trademark, and other intellectual property laws.
        </p>
      </>
    ),
  },
  compatibility: {
    title: "Browser and Display Compatibility",
    icon: <Monitor size={18} />,
    body: (
      <>
        <p><strong>Supported Browsers:</strong></p>
        <p className="mt-2">This platform is optimized for the following browsers:</p>
        <ul className="mt-2 ml-4 list-disc">
          <li>Google Chrome (version 120 or later)</li>
          <li>Microsoft Edge (version 120 or later)</li>
          <li>Mozilla Firefox (version 120 or later)</li>
          <li>Safari (version 17 or later)</li>
        </ul>
        <p className="mt-4"><strong>Display Requirements:</strong></p>
        <p className="mt-2">For the best experience, we recommend:</p>
        <ul className="mt-2 ml-4 list-disc">
          <li>Minimum screen resolution: 1366x768</li>
          <li>Recommended resolution: 1920x1080 or higher</li>
          <li>JavaScript must be enabled</li>
          <li>Cookies must be enabled</li>
        </ul>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    icon: <Shield size={18} />,
    body: (
      <>
        <div className="highlight-box">
          <strong>Wealth Management Platform - Privacy Policy</strong>
          <p style={{marginTop: '0.5rem', marginBottom: 0, fontSize: '0.875rem'}}>Last Updated: April 1, 2026</p>
        </div>

        <p>
          This Privacy Policy describes how Wealth Management Platform ("we", "us", or "our") collects, uses, 
          and protects your personal information. By using our services, you agree to the collection and use of 
          information in accordance with this policy.
        </p>

        <h3>1. Information Collection and Use</h3>
        <p>
          We collect several types of information for various purposes to provide and improve our service to you.
        </p>
        <p><strong>Types of Data Collected:</strong></p>
        <ul>
          <li><strong>Personal Data:</strong> Name, email address, phone number, and professional credentials</li>
          <li><strong>Financial Data:</strong> Client portfolio information, investment preferences, risk tolerance assessments, and transaction history</li>
          <li><strong>Usage Data:</strong> Information on how you access and use our platform, including IP address, browser type, device information, and pages visited</li>
          <li><strong>Cookies and Tracking:</strong> We use cookies and similar tracking technologies to track activity and hold certain information</li>
        </ul>

        <div className="section-divider"></div>

        <h3>2. Use of Data</h3>
        <p>Wealth Management Platform uses the collected data for various purposes:</p>
        <ul>
          <li>To provide and maintain our wealth management services</li>
          <li>To notify you about changes to our service</li>
          <li>To provide customer care and support</li>
          <li>To provide portfolio analysis, rebalancing recommendations, and investment proposals</li>
          <li>To gather analysis or valuable information to improve our service</li>
          <li>To monitor the usage of our service and detect technical issues</li>
          <li>To fulfill regulatory and compliance requirements</li>
          <li>To provide personalized financial insights and recommendations</li>
        </ul>

        <div className="section-divider"></div>

        <h3>3. Data Security</h3>
        <p>
          The security of your data is of paramount importance to us. We implement industry-leading security measures including:
        </p>
        <ul>
          <li>256-bit SSL/TLS encryption for all data transmission</li>
          <li>AES-256 encryption for data at rest</li>
          <li>Multi-factor authentication (MFA) for account access</li>
          <li>Regular security audits and penetration testing by third-party experts</li>
          <li>Strict access controls and role-based permissions</li>
          <li>Continuous monitoring and threat detection systems</li>
          <li>Regular employee security training and awareness programs</li>
        </ul>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
          strive to use commercially acceptable means to protect your personal data, we cannot guarantee its 
          absolute security.
        </p>

        <div className="section-divider"></div>

        <h3>4. Data Sharing and Disclosure</h3>
        <p>We may disclose your personal information in the following situations:</p>
        <ul>
          <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as cloud hosting, data analytics, and customer support</li>
          <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities (e.g., court orders, subpoenas)</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business</li>
          <li><strong>Regulatory Compliance:</strong> To comply with financial regulations and reporting requirements</li>
        </ul>
        <p><strong>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</strong></p>

        <div className="section-divider"></div>

        <h3>5. Your Data Protection Rights</h3>
        <p>Depending on your location, you may have the following rights under applicable data protection laws:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request copies of your personal data</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data under certain conditions</li>
          <li><strong>Right to Restrict Processing:</strong> Request restriction of processing your personal data</li>
          <li><strong>Right to Data Portability:</strong> Request transfer of your data to another organization or directly to you</li>
          <li><strong>Right to Object:</strong> Object to our processing of your personal data</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent to process your data</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at <strong>privacy@wealthmanagement.com</strong>. 
          We will respond to your request within 30 days.
        </p>

        <div className="section-divider"></div>

        <h3>6. Data Retention</h3>
        <p>
          We will retain your personal data only for as long as necessary for the purposes set out in this Privacy Policy. 
          We will retain and use your data to comply with our legal obligations, resolve disputes, and enforce our agreements.
        </p>
        <p>
          <strong>Retention Periods:</strong>
        </p>
        <ul>
          <li>Account information: Duration of account plus 7 years after closure</li>
          <li>Financial records and transaction data: Minimum of 7 years in accordance with regulatory requirements</li>
          <li>Usage and analytics data: Up to 2 years</li>
          <li>Marketing communications: Until you unsubscribe or request deletion</li>
        </ul>

        <div className="section-divider"></div>

        <h3>7. Cookies Policy</h3>
        <p>
          We use cookies and similar tracking technologies to track activity on our service and hold certain information. 
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you 
          do not accept cookies, you may not be able to use some portions of our service.
        </p>
        <p><strong>Types of Cookies We Use:</strong></p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for the operation of our service (e.g., authentication, security)</li>
          <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization (e.g., language preferences, user settings)</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our service to improve user experience</li>
          <li><strong>Performance Cookies:</strong> Collect information about how you use our platform to optimize performance</li>
        </ul>

        <div className="section-divider"></div>

        <h3>8. Third-Party Services</h3>
        <p>
          Our service may contain links to third-party websites or services that are not operated by us. We strongly 
          advise you to review the Privacy Policy of every site you visit. We have no control over and assume no 
          responsibility for the content, privacy policies, or practices of any third-party sites or services.
        </p>
        <p>
          We may integrate with third-party financial data providers, market data services, and analytics platforms 
          to enhance our service offerings. These integrations are subject to their respective privacy policies.
        </p>

        <div className="section-divider"></div>

        <h3>9. Children's Privacy</h3>
        <p>
          Our service is not intended for use by individuals under the age of 18. We do not knowingly collect personally 
          identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware 
          that your child has provided us with personal data, please contact us immediately.
        </p>

        <div className="section-divider"></div>

        <h3>10. International Data Transfers</h3>
        <p>
          Your information may be transferred to and maintained on computers located outside of your state, province, 
          country, or other governmental jurisdiction where data protection laws may differ from those in your jurisdiction.
        </p>
        <p>
          We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance 
          with this Privacy Policy. We use appropriate safeguards such as Standard Contractual Clauses approved by 
          regulatory authorities.
        </p>

        <div className="section-divider"></div>

        <h3>11. California Privacy Rights (CCPA)</h3>
        <p>
          If you are a California resident, you have specific rights regarding your personal information under the 
          California Consumer Privacy Act (CCPA):
        </p>
        <ul>
          <li>Right to know what personal information is collected, used, shared, or sold</li>
          <li>Right to delete personal information held by businesses</li>
          <li>Right to opt-out of sale of personal information (we do not sell personal information)</li>
          <li>Right to non-discrimination for exercising CCPA rights</li>
        </ul>

        <div className="section-divider"></div>

        <h3>12. Changes to This Privacy Policy</h3>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
          Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.
        </p>
        <p>
          For material changes, we will provide prominent notice or send you an email notification at least 30 days 
          before the changes take effect. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <div className="section-divider"></div>

        <h3>13. Contact Us</h3>
        <p>If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> privacy@wealthmanagement.com</li>
          <li><strong>Phone:</strong> +1 (800) 555-0123</li>
          <li><strong>Mail:</strong> Data Protection Officer, Wealth Management Platform, 123 Financial District, New York, NY 10004, USA</li>
          <li><strong>Response Time:</strong> We aim to respond to all inquiries within 30 days</li>
        </ul>

        <div className="highlight-box" style={{marginTop: '1.5rem'}}>
          <p style={{margin: 0}}>
            <strong>Your Consent:</strong> By using our Wealth Management Platform, you hereby consent to our Privacy Policy and agree to its terms.
          </p>
        </div>
      </>
    ),
  },
};

export default function InfoModal({ type, onClose }) {
  if (!type) return null;
  
  const { title, icon, body } = MODAL_CONTENT[type];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-top">
            <h2 className="modal-title">
              <span className="modal-title-icon">{icon}</span>
              {title}
            </h2>
            <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-body-inner">{body}</div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="modal-button modal-button-primary">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
