// src/pages/PrivacyPolicy.tsx
import React from "react";

export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Privacy Policy</h1>
      <p><strong>Effective date:</strong> February 19, 2026</p>

      <p>
        This Privacy Policy explains how CopStop San Diego Edition (“CopStop,” “we,” “our,” or “us”)
        collects, uses, and protects information when you use our mobile application and related services.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>
          <strong>Contact Information:</strong> Name and telephone number when you submit a report
          or request follow-up support.
        </li>
        <li>
          <strong>Report Information:</strong> Details you voluntarily provide about a police interaction,
          including dates, locations, descriptions, and any supporting information you choose to include.
        </li>
        <li>
          <strong>Authentication Information:</strong> Login credentials, verification codes (OTP),
          and secure access tokens for authorized staff users.
        </li>
        <li>
          <strong>Technical Information:</strong> Limited diagnostic and security logs necessary to
          maintain performance and prevent misuse.
        </li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>To allow users to submit reports regarding police interactions.</li>
        <li>To contact users within 48 hours for follow-up support if requested.</li>
        <li>To assist users in filing formal complaints when they choose to do so.</li>
        <li>To operate internal staff dashboards for case management.</li>
        <li>To improve reliability, security, and performance of the app.</li>
        <li>To comply with applicable laws and legal obligations.</li>
      </ul>

      <h2>How Information Is Shared</h2>
      <p>
        We do not sell, rent, or trade personal information.
      </p>
      <p>
        Information may be shared only:
      </p>
      <ul>
        <li>With authorized CopStop accountability staff for follow-up support.</li>
        <li>With service providers that securely host or maintain the application.</li>
        <li>When required by law or valid legal process.</li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We retain submitted information only as long as necessary to provide support services,
        maintain records, comply with legal obligations, and protect community members.
      </p>

      <h2>Security</h2>
      <p>
        We implement reasonable administrative, technical, and organizational safeguards to protect
        personal information. However, no method of electronic transmission or storage is completely secure.
      </p>

      <h2>Your Rights and Choices</h2>
      <ul>
        <li>You may request access to the personal information you submitted.</li>
        <li>You may request correction or deletion of your information, subject to legal limitations.</li>
        <li>You may decline to provide information, but this may limit certain features of the app.</li>
      </ul>

      <h2>Children’s Privacy</h2>
      <p>
        The app is not directed toward children under 13. We do not knowingly collect information
        from children under 13 without appropriate consent.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Updates will be posted on this page
        with a revised effective date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, contact:
      </p>
      <p>
        <a href="mailto:support@copstopsd.org">support@copstopsd.org</a>
      </p>
    </main>
  );
}