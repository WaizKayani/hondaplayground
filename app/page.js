import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-card">
        <h1>Honda × OSU AI Playground</h1>
        <p>
          Connecting OSU students with real-world engineering opportunities at
          Honda.
        </p>
        <div className="landing-actions">
          <Link href="/student/select-profile" className="btn">
            Continue as Student
          </Link>
          <Link href="/honda" className="btn btn-secondary">
            Continue as Honda
          </Link>
        </div>
      </div>
    </main>
  );
}
