import { PathClient } from "@/components/path-client";
import { getCatalog } from "@/lib/content";

export default function PathPage() {
  return <PathClient catalog={getCatalog()} />;
}
