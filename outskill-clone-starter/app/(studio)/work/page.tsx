import { WorkClient } from "@/components/work-client";
import { getCatalog } from "@/lib/content";

export const metadata = { title: "My Work · Outskill" };

export default function WorkPage() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR LEARNING PORTFOLIO</p>
        <h1>Keep the work you can build on.</h1>
        <p>Notes live beside the guides that produced them. In production this is a table keyed by user.</p>
      </div>
      <WorkClient catalog={getCatalog()} />
    </>
  );
}
