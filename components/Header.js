"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ onResetDemo }) {
  const pathname = usePathname();

  function isActive(path) {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-block">
          <div className="brand-title">Honda × OSU AI Playground</div>
          <div className="brand-subtitle">Student–Engineer Project Matching</div>
          <span className="prototype-badge">Prototype Demo</span>
        </div>
        <nav className="header-nav" aria-label="Main">
          <Link
            href="/"
            className={`nav-link${isActive("/") && pathname === "/" ? " active" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/student"
            className={`nav-link${isActive("/student") ? " active" : ""}`}
          >
            Student
          </Link>
          <Link
            href="/honda"
            className={`nav-link${isActive("/honda") ? " active" : ""}`}
          >
            Honda
          </Link>
          {onResetDemo && (
            <button type="button" className="btn-reset" onClick={onResetDemo}>
              Reset Demo
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
