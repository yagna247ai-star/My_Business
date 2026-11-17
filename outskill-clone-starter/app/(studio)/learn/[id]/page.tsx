import Link from "next/link";
import { notFound } from "next/navigation";
import { CompleteButton } from "@/components/complete-button";
import { Markdown } from "@/components/markdown";
import { getCatalog, getDetail } from "@/lib/content";

const kindLabel: Record<string, string> = {
  lesson: "Lesson",
  workbook: "Guided workbook",
  project: "Project",
  glossary: "Glossary",
  resource: "Resource",
  help: "Troubleshooting",
};

export function generateStaticParams() {
  return getCatalog().map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getDetail(id);
  return {
    title: detail ? `${detail.title} · Outskill` : "Not found · Outskill",
    description: detail?.summary,
  };
}

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getDetail(id);
  if (!detail) notFound();

  const catalog = getCatalog();
  const index = catalog.findIndex((item) => item.id === id);
  const next = catalog[index + 1];
  const sections = detail.sections ?? [];
  const steps = detail.steps ?? [];
  const samples = detail.samples ?? [];

  return (
    <>
      <div className="reader-toolbar">
        <Link className="text-button" href="/learn">
          ← Back to course
        </Link>
        <span className="quiet">
          {kindLabel[detail.kind]} · Level {detail.level} · {detail.minutes} min
        </span>
      </div>

      <header className="reader-title">
        <p className="eyebrow">{detail.tool.toUpperCase()}</p>
        <h1>{detail.title}</h1>
        <p>{detail.summary}</p>

        {detail.outcome && (
          <div className="outcome">
            <strong>By the end of this lesson</strong>
            <span>{detail.outcome}</span>
          </div>
        )}
      </header>

      <div className="reader-layout">
        <nav className="reader-index" aria-label="On this page">
          <p>In this guide</p>
          <a href="#overview">Overview</a>
          {samples.length > 0 && <a href="#sample">Sample material</a>}
          {sections.map((section, sectionIndex) => (
            <a key={section.title} href={`#section-${sectionIndex}`}>
              {section.title}
            </a>
          ))}
          {steps.length > 0 && <a href="#steps">Steps</a>}
          {(detail.checks?.length ?? 0) > 0 && <a href="#checks">Check yourself</a>}
          {(detail.sources?.length ?? 0) > 0 && <a href="#sources">Sources</a>}
        </nav>

        <article className="reader-body">
          {detail.notice && (
            <p className="quiet" style={{ marginBottom: 18 }}>
              {detail.notice}
            </p>
          )}

          {detail.body && (
            <section id="overview" className="reading-block">
              <Markdown content={detail.body} />
            </section>
          )}

          {(detail.prerequisites?.length ?? 0) > 0 && (
            <section className="reading-block">
              <h2>Before you start</h2>
              <ul className="prose">
                {detail.prerequisites!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {samples.length > 0 && (
            <section id="sample" className="reading-block">
              <p className="eyebrow">FICTIONAL PRACTICE MATERIAL</p>
              <h2>{samples[0].name}</h2>
              <div className="sample">{samples[0].content}</div>
            </section>
          )}

          {sections.map((section, sectionIndex) => (
            <section
              id={`section-${sectionIndex}`}
              className="reading-block"
              key={section.title}
            >
              <h2>{section.title}</h2>
              <Markdown content={section.body} />
            </section>
          ))}

          {steps.length > 0 && (
            <section id="steps" className="reading-block">
              <p className="eyebrow">READ THE EXAMPLE. TRY THE STEPS.</p>
              <h2>Steps</h2>
              {steps.map((step, stepIndex) => (
                <div className="step" key={step.title}>
                  <span className="num">{stepIndex + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <ul className="prose">
                      {step.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                    {step.expected && <p className="expected">Expected: {step.expected}</p>}
                  </div>
                </div>
              ))}
            </section>
          )}

          {detail.variants && (
            <section className="reading-block">
              <p className="eyebrow">HOW THE GUIDE WORKS</p>
              <h2>Choose your level of help</h2>
              {Object.entries(detail.variants).map(([level, description]) => (
                <p key={level}>
                  <strong style={{ textTransform: "capitalize" }}>{level}:</strong> {description}
                </p>
              ))}
            </section>
          )}

          {(detail.checks?.length ?? 0) > 0 && (
            <section id="checks" className="reading-block">
              <p className="eyebrow">BEFORE YOU MOVE ON</p>
              <h2>Check yourself</h2>
              <ul className="check-list">
                {detail.checks!.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </section>
          )}

          {(detail.sources?.length ?? 0) > 0 && (
            <section id="sources" className="reading-block">
              <p className="eyebrow">ORIGINAL SOURCES</p>
              <h2>Read more or check a tool’s controls</h2>
              <ul className="source-list">
                {detail.sources!.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    {source.provider && <span className="quiet"> · {source.provider}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="reader-finish">
            <div>
              <strong>Finished this guide?</strong>
              <p className="quiet" style={{ margin: "4px 0 0" }}>
                Optional: keep track of your own progress. No written submission needed.
              </p>
            </div>
            <CompleteButton id={detail.id} />
          </div>

          {next && (
            <section className="reading-block" style={{ marginTop: 26 }}>
              <p className="eyebrow">YOUR NEXT STEP</p>
              <h2>
                <Link href={`/learn/${next.id}`}>{next.title}</Link>
              </h2>
              <p className="quiet">{next.summary}</p>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
