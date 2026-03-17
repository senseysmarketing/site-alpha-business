import { DailyPlanCard } from "@/components/admin/marketing/DailyPlanCard";
import { LeadActivityTimeline } from "@/components/admin/marketing/LeadActivityTimeline";
import { SmartAlertsFeed } from "@/components/admin/marketing/SmartAlertsFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Marketing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Raleway] text-xl font-semibold text-foreground">
          Central de Marketing & Alertas
        </h1>
        <p className="font-[Inter] text-sm text-muted-foreground mt-1">
          Automação, follow-ups e alertas inteligentes em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-6">
          <DailyPlanCard />
          <LeadActivityTimeline />
        </div>

        {/* Sidebar - Alerts */}
        <div className="lg:col-span-4">
          <Card className="bg-white border-border/50 shadow-none sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="font-[Raleway] text-base font-semibold">
                🚦 Painel de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SmartAlertsFeed />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
