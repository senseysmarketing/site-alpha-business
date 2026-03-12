import { MessageCircle, Calendar } from "lucide-react";

interface PropertySidebarProps {
  brokerName: string;
  brokerTitle: string;
  whatsappNumber?: string;
}

const PropertySidebar = ({
  brokerName,
  brokerTitle,
  whatsappNumber = "5511999999999",
}: PropertySidebarProps) => {
  return (
    <div className="sticky top-24 space-y-6">
      {/* Broker card */}
      <div className="border border-border rounded-sm p-6 bg-card">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar placeholder */}
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

          <button className="flex items-center justify-center gap-2 w-full py-3 border border-border text-body text-sm font-medium text-foreground rounded-sm hover:bg-muted transition-colors">
            <Calendar size={18} />
            Agendar visita
          </button>
        </div>
      </div>

      {/* Property code */}
      <p className="text-body text-[11px] text-muted-foreground text-center uppercase tracking-widest">
        Atendimento exclusivo e personalizado
      </p>
    </div>
  );
};

export default PropertySidebar;
