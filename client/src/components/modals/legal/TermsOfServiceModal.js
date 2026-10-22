import React from "react";

import LegalModal, {
  LegalSection,
  LegalParagraph,
  LegalSubheading,
  LegalBullet,
  LegalContactLine,
} from "./LegalModal";

export default function TermsOfServiceModal({
  visible,
  onClose,
}) {
  return (
    <LegalModal
      visible={visible}
      onClose={onClose}
      title="Terms of Service"
      lastUpdated="October 21, 2026"
      type="document"
    >
      <LegalParagraph>
        Welcome to SaferMzansi. Please read these
        Terms of Service (“Terms”, “Agreement”)
        carefully before using the SaferMzansi mobile
        application (“App”, “Service”).
      </LegalParagraph>

      <LegalParagraph>
        By downloading, installing, accessing, or
        using SaferMzansi, you agree to be legally
        bound by these Terms. If you do not agree to
        these Terms, you must immediately uninstall
        and cease all use of the Application.
      </LegalParagraph>

      <LegalSection
        number="1"
        title="NATURE AND SCOPE OF SERVICE"
      >
        <LegalSubheading>
          1.1 Emergency Alerting & Decoy Functionality
        </LegalSubheading>

        <LegalParagraph>
          SaferMzansi is a multi-modal, privacy-focused
          safety tool designed to assist users in
          potential emergency situations. The App
          provides covert activation mechanisms (such
          as hardware gesture triggers), a decoy
          calculator interface, encrypted online
          evidence storage, and automated notification
          dispatches (via email) to designated personal
          emergency contacts.
        </LegalParagraph>

        <LegalSubheading>
          1.2 Not a Replacement for Official Emergency
          Services
        </LegalSubheading>

        <LegalParagraph>
          SaferMzansi is a supplementary personal
          safety tool. It is not an official government
          service, public safety answering point
          (PSAP), or integrated direct-dispatch line
          to South African law enforcement (SAPS) or
          public emergency medical services.
        </LegalParagraph>

        <LegalSubheading>
          1.3 Network & Device Dependencies
        </LegalSubheading>

        <LegalParagraph>
          Successful transmission of emergency
          dispatches, real-time location streaming,
          and cloud synchronization depends entirely
          on external factors, including mobile
          network connectivity, device power, active
          SMS/data balances, location services (GPS),
          and hardware sensor availability.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="2"
        title="ELIGIBILITY AND ACCOUNT RESPONSIBILITY"
      >
        <LegalSubheading>
          2.1 Accuracy of Information
        </LegalSubheading>

        <LegalParagraph>
          You agree to provide accurate, current, and
          complete details for your account and your
          designated emergency contact lists. You are
          solely responsible for obtaining permission
          from your emergency contacts before listing
          their contact details in the App.
        </LegalParagraph>

        <LegalSubheading>
          2.2 Security & Passcodes
        </LegalSubheading>

        <LegalParagraph>
          You are responsible for maintaining the
          confidentiality of your PIN, decoy
          passcodes, and access credentials.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="3"
        title="ACCEPTABLE USE AND PROHIBITED CONDUCT"
      >
        <LegalParagraph>
          You agree not to use SaferMzansi to:
        </LegalParagraph>

        <LegalBullet>
          Trigger false, malicious, or prank emergency
          dispatches or alerts.
        </LegalBullet>

        <LegalBullet>
          Reverse-engineer, decompile, or attempt to
          extract source code or cryptographic
          mechanisms from the App.
        </LegalBullet>

        <LegalBullet>
          Unlawfully record or capture audio, visual,
          or location data of third parties without
          proper legal justification or authorization.
        </LegalBullet>

        <LegalBullet>
          Interfere with or compromise the integrity,
          security, or availability of the backend
          infrastructure or location routing engines.
        </LegalBullet>
      </LegalSection>

      <LegalSection
        number="4"
        title="EVIDENCE VAULT & DATA PROTECTION"
      >
        <LegalSubheading>
          4.1 Local Encryption
        </LegalSubheading>

        <LegalParagraph>
          SaferMzansi includes an encrypted vault
          designed to secure recorded data locally on
          cloud based infrastructure.
        </LegalParagraph>

        <LegalSubheading>
          4.2 User Responsibility
        </LegalSubheading>

        <LegalParagraph>
          You acknowledge that if you lose or forget
          your access credentials or uninstall the App
          without syncing, encrypted local data may
          become permanently unrecoverable.
        </LegalParagraph>

        <LegalSubheading>
          4.3 Data Privacy
        </LegalSubheading>

        <LegalParagraph>
          Personal data processing is governed by our
          Privacy Policy, which complies with the
          Protection of Personal Information Act
          (POPIA).
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="5"
        title="DISCLAIMER OF WARRANTIES AND LIMITATION OF LIABILITY"
      >
        <LegalSubheading>
          5.1 "As-Is" Service
        </LegalSubheading>

        <LegalParagraph>
          SaferMzansi is provided on an "AS IS" and
          "AS AVAILABLE" basis without warranties of
          any kind, express or implied. We do not
          guarantee uninterrupted operational
          availability, immediate delivery of email
          dispatches, or absolute location accuracy.
        </LegalParagraph>

        <LegalSubheading>
          5.2 Limitation of Liability
        </LegalSubheading>

        <LegalParagraph>
          To the maximum extent permitted by South
          African law (including the Consumer
          Protection Act 68 of 2008):
        </LegalParagraph>

        <LegalBullet>
          SaferMzansi, its developers, and affiliates
          shall not be liable for any direct, indirect,
          incidental, or consequential damages
          resulting from network delays, failed alert
          transmissions, device incompatibilities, or
          third-party response failures.
        </LegalBullet>

        <LegalBullet>
          You acknowledge that emergency situations
          involve inherent risks, and you use the
          Application as a supplementary safety
          measure at your own risk.
        </LegalBullet>
      </LegalSection>

      <LegalSection
        number="6"
        title="INTELLECTUAL PROPERTY"
      >
        <LegalParagraph>
          All source code, software design, interface
          elements, branding, logos, and proprietary
          algorithms associated with SaferMzansi
          remain the exclusive intellectual property
          of the platform developers.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="7"
        title="TERMINATION"
      >
        <LegalParagraph>
          We reserve the right to suspend or terminate
          your access to the Service at our sole
          discretion, without prior notice, if you
          breach these Terms or misuse the emergency
          alert features.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="8"
        title="GOVERNING LAW AND JURISDICTION"
      >
        <LegalParagraph>
          These Terms are governed by and construed
          in accordance with the laws of the Republic
          of South Africa. Any legal dispute arising
          under these Terms shall be subject to the
          jurisdiction of the competent courts in
          South Africa.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="9"
        title="CONTACT US"
      >
        <LegalParagraph>
          If you have any questions regarding these
          Terms, please contact support at:
        </LegalParagraph>

        <LegalContactLine
          label="Email"
          value="safermzansi@gmail.com"
        />
      </LegalSection>
    </LegalModal>
  );
}