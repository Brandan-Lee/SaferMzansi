import React from "react";

import LegalModal, {
  LEGAL_DOCUMENT_LAST_UPDATED,
  LegalSection,
  LegalParagraph,
  LegalSubheading,
  LegalBullet,
  LegalContactLine,
} from "./LegalModal";

export default function PrivacyPolicyModal({
  visible,
  onClose,
}) {
  return (
    <LegalModal
      visible={visible}
      onClose={onClose}
      title="Privacy Policy"
      lastUpdated={LEGAL_DOCUMENT_LAST_UPDATED}
      type="privacy"
    >
      <LegalParagraph>
        SaferMzansi (“we”, “us”, “our”) is committed
        to protecting your privacy and personal
        information. This Privacy Policy explains how
        we collect, use, store, and protect your
        personal information when you use the
        SaferMzansi mobile application (“App”) and
        related backend services, in accordance with
        the Protection of Personal Information Act 4
        of 2013 (POPIA) of South Africa.
      </LegalParagraph>

      <LegalSection
        number="1"
        title="INFORMATION WE COLLECT"
      >
        <LegalParagraph>
          To provide core personal safety and
          emergency dispatch functionality,
          SaferMzansi collects and processes the
          following categories of information:
        </LegalParagraph>

        <LegalSubheading>
          Account & Registration Data
        </LegalSubheading>

        <LegalParagraph>
          Mobile phone number, account credentials,
          and authentication data.
        </LegalParagraph>

        <LegalSubheading>
          Emergency Contacts
        </LegalSubheading>

        <LegalParagraph>
          Names, phone numbers, and email addresses
          of your designated personal emergency
          contacts.
        </LegalParagraph>

        <LegalSubheading>
          Location & Spatial Data
        </LegalSubheading>

        <LegalParagraph>
          Real-time device location (GPS coordinates)
          captured during emergency trigger events
          or active location-sharing sessions.
        </LegalParagraph>

        <LegalSubheading>
          Online Encrypted Evidence Vault Data
        </LegalSubheading>

        <LegalParagraph>
          Media recordings, notes, or evidence
          captured via the App. Note: Vault contents
          are encrypted on a cloud based infrastructure.
          We do not hold decryption keys to your private
          local vault.
        </LegalParagraph>

        <LegalSubheading>
          Technical & Telemetry Data
        </LegalSubheading>

        <LegalParagraph>
          Device model, operating system version,
          hardware gesture sensor parameters (e.g.,
          accelerometer settings for covert
          activation), network connectivity status,
          and basic usage logs.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="2"
        title="PURPOSE AND LEGAL BASIS FOR PROCESSING"
      >
        <LegalParagraph>
          We process your personal information for
          the following specific, lawful purposes
          under POPIA:
        </LegalParagraph>

        <LegalSubheading>
          Emergency Dispatches
        </LegalSubheading>

        <LegalParagraph>
          Transmitting immediate location coordinates
          and automated alerts via email to your
          designated emergency contacts when a covert
          or explicit emergency gesture is activated.
        </LegalParagraph>

        <LegalSubheading>
          Evidence Preservation
        </LegalSubheading>

        <LegalParagraph>
          Storing and managing encrypted spatial and
          incident metadata on secure backend
          infrastructure.
        </LegalParagraph>

        <LegalSubheading>
          Service Maintenance
        </LegalSubheading>

        <LegalParagraph>
          Improving hardware sensor accuracy, backend
          routing engine efficiency, and system
          safety.
        </LegalParagraph>

        <LegalSubheading>
          Legal Compliance
        </LegalSubheading>

        <LegalParagraph>
          Fulfilling legal obligations under South
          African law where required.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="3"
        title="HOW YOUR DATA IS SHARED AND DISCLOSED"
      >
        <LegalParagraph>
          We do not sell, rent, or trade your personal
          information. Your data is shared only in
          the following limited circumstances:
        </LegalParagraph>

        <LegalSubheading>
          Designated Emergency Contacts
        </LegalSubheading>

        <LegalParagraph>
          When an emergency alert is triggered, your
          real-time location and alert message are
          dispatched directly to the contacts you
          specified.
        </LegalParagraph>

        <LegalSubheading>
          Service Providers
        </LegalSubheading>

        <LegalParagraph>
          We utilize trusted third-party cloud
          infrastructure, database hosting, and
          communications providers (e.g., Email
          gateways) to execute emergency dispatches
          and store encrypted server data.
        </LegalParagraph>

        <LegalSubheading>
          Legal Requirements
        </LegalSubheading>

        <LegalParagraph>
          We may disclose information if required by
          law, court order, or formal request from
          South African law enforcement authorities.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="4"
        title="DATA SECURITY AND ENCRYPTION"
      >
        <LegalParagraph>
          We implement strict technical and
          organizational measures to safeguard your
          personal information:
        </LegalParagraph>

        <LegalSubheading>
          Vault Encryption
        </LegalSubheading>

        <LegalParagraph>
          Local evidence vault files are secured on
          cloud based infrastructure using standard
          AES-256 encryption algorithms.
        </LegalParagraph>

        <LegalSubheading>
          In-Transit Encryption
        </LegalSubheading>

        <LegalParagraph>
          Communications between the App and our
          backend servers are secured using TLS/SSL
          encryption protocols.
        </LegalParagraph>

        <LegalSubheading>
          Access Controls
        </LegalSubheading>

        <LegalParagraph>
          Strict role-based access controls (RBAC)
          restrict access to server-side database
          records.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="5"
        title="DATA RETENTION AND DELETION"
      >
        <LegalSubheading>
          Account Data
        </LegalSubheading>

        <LegalParagraph>
          Retained for as long as your account
          remains active.
        </LegalParagraph>

        <LegalSubheading>
          Emergency Logs
        </LegalSubheading>

        <LegalParagraph>
          Location and incident dispatch logs are
          retained for as long as necessary to
          fulfill safety services, preserve evidence
          at your request, or meet legal requirements.
        </LegalParagraph>

        <LegalSubheading>
          Account Deletion
        </LegalSubheading>

        <LegalParagraph>
          You can request the deletion of your account
          and associated cloud data at any time via
          the App settings or by contacting our
          Information Officer. Upon deletion, server
          records will be permanently purged, subject
          to regulatory retention obligations.
        </LegalParagraph>
      </LegalSection>

      <LegalSection
        number="6"
        title="YOUR RIGHTS UNDER POPIA"
      >
        <LegalParagraph>
          Subject to statutory exceptions, you have
          the right to:
        </LegalParagraph>

        <LegalBullet>
          Access: Request details of the personal
          information we hold about you.
        </LegalBullet>

        <LegalBullet>
          Correction: Request the correction or
          updating of inaccurate or out-of-date
          personal information.
        </LegalBullet>

        <LegalBullet>
          Objection & Deletion: Object to processing
          or request the destruction/deletion of your
          personal records.
        </LegalBullet>

        <LegalBullet>
          Complain: File a complaint with the South
          African Information Regulator if you believe
          your privacy rights have been violated.
        </LegalBullet>

        <LegalContactLine
          label="Website"
          value="https://inforegulator.org.za/"
        />

        <LegalContactLine
          label="Email"
          value="enquiries@inforegulator.org.za / POPIAComplaints@inforegulator.org.za"
        />
      </LegalSection>

      <LegalSection
        number="7"
        title="CONTACT DETAILS"
      >
        <LegalParagraph>
          If you have questions, concerns, or wish
          to exercise your rights under POPIA,
          please contact our Information Officer:
        </LegalParagraph>

        <LegalContactLine
          label="Data Protection / Information Officer"
          value="Brandan-Lee James Sherbrooke"
        />

        <LegalContactLine
          label="Email"
          value="safermzansi@gmail.com"
        />
      </LegalSection>
    </LegalModal>
  );
}