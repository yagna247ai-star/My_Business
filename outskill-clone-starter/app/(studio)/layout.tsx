import { Rail } from "@/components/rail";
import { Topbar } from "@/components/topbar";
import { getCatalog } from "@/lib/content";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const catalog = getCatalog();

  return (
    <div className="studio">
      <a className="skip-link" href="#main-content">
        Skip to learning
      </a>
      <Rail />
      <div className="workspace">
        <Topbar catalog={catalog} />
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
