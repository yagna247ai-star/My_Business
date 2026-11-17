import Link from 'next/link';

export const metadata = { title: 'Privacy notice' };

/**
 * Placeholder until counsel approves the privacy notice (see PENDING_LEGAL.md §28).
 * Deliberately makes no compliance claims.
 */
export default function PrivacyPage() {
  return (
    <main id="main" style={{ maxWidth: 680, margin: '0 auto', padding: '48px 16px', lineHeight: 1.6 }}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>Privacy</p>
      <h1 style={{ marginTop: 6, fontSize: 28 }}>Privacy notice</h1>
      <p>
        The full privacy notice for AI Accelerator Hub is being finalised and is under legal review. Until it is published,
        please contact your institution or programme administrator with any questions about how your data is used.
      </p>
      <p>
        Your data is used to run your learning journey. It is not sold.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ textDecoration: 'underline' }}>Back to the main site</Link>
      </p>
    </main>
  );
}
