import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./PublicComplaintPage.css";

export default function ComplaintThankYouPage() {
  const [searchParams] = useSearchParams();
  const caseNumber = searchParams.get("case");

  return (
    <main className="complaint-page">
      <section className="complaint-card complaint-success-card">
        <h1>Complaint Submitted</h1>
        <p>Your report was sent directly to our system.</p>

        {caseNumber ? (
          <div className="case-number-box">
            <span>Reference Number</span>
            <strong>{caseNumber}</strong>
          </div>
        ) : null}

        <p>
          A community advocate will contact you. If this happened within the last
          six months, there may be important complaint deadlines.
        </p>

        <Link to="/complaint" className="complaint-submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Submit Another Complaint
        </Link>
      </section>
    </main>
  );
}
