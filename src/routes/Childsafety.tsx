import React from "react";

type ChildSafetyPolicyProps = {
  appName?: string;
  supportEmail?: string;
  websiteName?: string;
  lastUpdated?: string;
};

export default function ChildSafetyPolicy({
  appName = "CopStopSD",
  supportEmail = "support@copstopsd.org",
  websiteName = "CopStopSD",
  lastUpdated = "March 8, 2026",
}: ChildSafetyPolicyProps) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Child Safety Policy
          </h1>
          <p className="mt-3 text-base text-gray-600">
            {websiteName} is committed to protecting children and maintaining a
            safe platform for all users.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Last updated:</span> {lastUpdated}
          </p>
        </header>

        <section className="space-y-8 leading-7">
          <div>
            <h2 className="text-2xl font-semibold">1. Our Commitment</h2>
            <p className="mt-3">
              {appName} maintains a zero-tolerance policy toward child sexual
              abuse and exploitation (CSAE), including child sexual abuse
              material (CSAM), grooming, solicitation, trafficking, and any
              form of exploitation or abuse involving minors.
            </p>
            <p className="mt-3">
              Any content, behavior, or activity that exploits, sexualizes, or
              endangers children is strictly prohibited on our platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">2. Prohibited Content and Conduct</h2>
            <p className="mt-3">
              Users may not use {appName} to create, upload, share, request,
              promote, or distribute:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Child sexual abuse material (CSAM)</li>
              <li>Sexual content involving minors or anyone appearing to be a minor</li>
              <li>Grooming, enticement, or sexual solicitation of minors</li>
              <li>Content that exploits, abuses, or endangers children</li>
              <li>Trafficking, coercion, or predatory behavior involving minors</li>
              <li>Any attempt to normalize, encourage, or facilitate CSAE</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">3. Reporting</h2>
            <p className="mt-3">
              We encourage users to report suspected violations immediately. If
              you become aware of any content or conduct that may involve child
              exploitation, abuse, or endangerment, please contact us at:
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium">Safety Contact</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-blue-700 underline underline-offset-2"
                >
                  {supportEmail}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">4. Enforcement</h2>
            <p className="mt-3">
              We review reports of child safety violations promptly. When we
              determine that content or conduct violates this policy, we may
              take action including:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Removing the offending content</li>
              <li>Suspending or permanently banning accounts</li>
              <li>Restricting access to platform features</li>
              <li>Preserving evidence as required by law</li>
              <li>Reporting the matter to appropriate authorities</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">5. Legal Compliance</h2>
            <p className="mt-3">
              {appName} complies with applicable child protection laws and
              regulations. Where required, we report confirmed child sexual
              abuse material and related exploitation activity to the National
              Center for Missing and Exploited Children (NCMEC) and/or other
              appropriate law enforcement or regulatory authorities.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">6. User Responsibility</h2>
            <p className="mt-3">
              All users of {appName} are expected to help maintain a safe
              environment. By using this platform, users agree not to engage in
              any behavior that harms, exploits, or endangers children and to
              report suspected violations immediately.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">7. Contact</h2>
            <p className="mt-3">
              For questions about this Child Safety Policy or to report a child
              safety concern, please contact:
            </p>
            <p className="mt-3">
              <strong>{appName} Safety Team</strong>
              <br />
              <a
                href={`mailto:${supportEmail}`}
                className="text-blue-700 underline underline-offset-2"
              >
                {supportEmail}
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}