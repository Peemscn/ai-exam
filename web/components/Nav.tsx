import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container navinner">
        <Link href="/" className="logo">
          🧪 AI Exam Lab
        </Link>
        <div className="navlinks">
          <Link href="/q1">Q1 · Feedback</Link>
          <Link href="/q2">Q2 · Gacha</Link>
          <Link href="/q3">Q3 · Food</Link>
          <Link href="/api-docs">API</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
