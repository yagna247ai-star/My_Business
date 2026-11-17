import { ExploreClient } from "@/components/explore-client";
import { getCatalog } from "@/lib/content";

export const metadata = { title: "Explore · Outskill" };

export default function ExplorePage() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">THE COMPLETE REFERENCE LIBRARY</p>
        <h1>Look something up.</h1>
        <p>Lessons, workbooks, projects and glossary entries in one filterable list.</p>
      </div>
      <ExploreClient catalog={getCatalog()} />
    </>
  );
}
