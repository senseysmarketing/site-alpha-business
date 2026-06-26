import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { formatBRPhone } from "@/lib/phone";

interface TeamMemberCardProps {
  id: string;
  userId: string;
  fullName: string;
  roleDisplay: string;
  role: string;
  avatarUrl?: string | null;
  creci?: string | null;
  phone?: string | null;
  availability: string;
  isActive: boolean;
}

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-[#2A070C]/10 text-[#2A070C] border-[#2A070C]/20",
  gerente: "bg-amber-100 text-amber-800 border-amber-200",
  corretor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  assistente: "bg-slate-100 text-slate-600 border-slate-200",
  moderator: "bg-purple-100 text-purple-800 border-purple-200",
  user: "bg-slate-100 text-slate-600 border-slate-200",
};

const availabilityConfig: Record<string, { color: string; label: string }> = {
  online: { color: "bg-emerald-500", label: "Online" },
  em_visita: { color: "bg-amber-500", label: "Em Visita" },
  offline: { color: "bg-slate-300", label: "Offline" },
};

const TeamMemberCard = ({
  id,
  fullName,
  roleDisplay,
  role,
  avatarUrl,
  creci,
  phone,
  availability,
  isActive,
}: TeamMemberCardProps) => {
  const navigate = useNavigate();
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avail = availabilityConfig[availability] || availabilityConfig.offline;
  const badgeStyle = roleBadgeStyles[role] || roleBadgeStyles.user;

  return (
    <motion.div
      layoutId={`team-card-${id}`}
      onClick={() => navigate(`/admin/equipe/${id}`)}
      className={`group relative bg-white rounded-sm border border-border/50 p-6 cursor-pointer transition-shadow hover:shadow-md ${!isActive ? "opacity-50" : ""}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <motion.div layoutId={`team-avatar-${id}`}>
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="bg-muted text-muted-foreground font-[Raleway] text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${avail.color}`}
            title={avail.label}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-[Raleway] font-semibold text-foreground text-base truncate">
            {fullName}
          </h3>
          <p className="text-muted-foreground text-xs font-[Inter] mt-0.5">
            {roleDisplay}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className={`text-[10px] font-medium ${badgeStyle}`}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
            {creci && (
              <span className="text-[10px] text-muted-foreground/60 font-[Inter]">
                CRECI {creci}
              </span>
            )}
          </div>

          {phone && (
            <p className="text-[11px] text-muted-foreground/70 font-[Inter] mt-2">
              {formatBRPhone(phone)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TeamMemberCard;
