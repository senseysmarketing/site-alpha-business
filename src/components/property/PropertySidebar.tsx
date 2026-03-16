import { useState } from "react";
import { MessageCircle, Calendar } from "lucide-react";
import ScheduleVisitModal from "./ScheduleVisitModal";

interface PropertySidebarProps {
  brokerName: string;
  brokerTitle: string;
  whatsappNumber?: string;
  propertyCode: string;
}

const PropertySidebar = ({
  brokerName,
  brokerTitle,
  whatsappNumber = "5511999999999",
  propertyCode,
}: PropertySidebarProps) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <div className="sticky top-24 space-y-6">
      {/* Broker card */}
      <div className="border border-border rounded-sm p-6 bg-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <span className="text-display text-lg font-semibold text-muted-foreground">
              {brokerName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-body text-sm font-medium text-foreground">{brokerName}</p>
            <p className="text-body text-xs text-muted-foreground">{brokerTitle}</p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white text-body text-sm font-medium rounded-sm hover:bg-[#20bd5a] transition-colors"
          >
            <MessageCircle size={18} />
            Falar com {brokerName.split(" ")[0]}
          </a>

          <button
            onClick={() => setScheduleOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 border border-border text-body text-sm font-medium text-foreground rounded-sm hover:bg-muted transition-colors"
          >
            <Calendar size={18} />
            Agendar visita
          </button>
        </div>
      </div>

      <p className="text-body text-[11px] text-muted-foreground text-center uppercase tracking-widest">
        Atendimento exclusivo e personalizado
      </p>
      <p className="text-body text-[10px] text-muted-foreground/60 text-center tracking-wider">
        CRECI 123.456-F
      </p>

      <ScheduleVisitModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        propertyCode={propertyCode}
        brokerName={brokerName}
      />
    </div>
  );
};

export default PropertySidebar;
