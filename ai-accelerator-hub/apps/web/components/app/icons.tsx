import { Rocket, Map, Award, ChartColumn, BookOpen, LifeBuoy, Settings, Inbox, ChartLine, Users, Shield, CreditCard, Layers, Compass } from 'lucide-react';

const MAP = { rocket: Rocket, map: Map, award: Award, ranks: ChartColumn, book: BookOpen, lifebuoy: LifeBuoy, settings: Settings, inbox: Inbox, chart: ChartLine, users: Users, shield: Shield, card: CreditCard, layers: Layers, compass: Compass } as const;
export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const I = MAP[name as keyof typeof MAP] || Rocket;
  return <I size={size} aria-hidden="true" />;
}
