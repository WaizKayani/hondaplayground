import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Honda × OSU AI Playground",
  description:
    "Student–Engineer Project Matching prototype from OSU CSI and Honda.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
