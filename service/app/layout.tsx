export const metadata = { title: "Loonars AI Advisor", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24, background: "#0f1729", color: "#e2e8f0" }}>{children}</body>
    </html>
  );
}
