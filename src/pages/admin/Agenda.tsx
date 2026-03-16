import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  MapPin,
  Clock,
  ExternalLink,
  Plus,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import ScheduleVisitModal from "@/components/property/ScheduleVisitModal";

type Visit = {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  property_code: string;
  broker_name: string;
  visit_date: string;
  visit_time: string;
};

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
  const [visitDates, setVisitDates] = useState<Date[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    const today = new Date();
    setTodayVisits(
      visits.filter((v) => isSameDay(new Date(v.visit_date + "T00:00:00"), today))
    );

    const dates = visits.map((v) => new Date(v.visit_date + "T00:00:00"));
    setVisitDates(dates);
  }, [visits]);

  const fetchVisits = async () => {
    const { data } = await supabase
      .from("visits_scheduling")
      .select("*")
      .order("visit_date", { ascending: true })
      .order("visit_time", { ascending: true });
    if (data) setVisits(data);
  };

  const selectedDayVisits = visits.filter((v) =>
    isSameDay(new Date(v.visit_date + "T00:00:00"), selectedDate)
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const getMapsUrl = (propertyCode: string) =>
    `https://www.google.com/maps/search/?api=1&query=Alphaville+${propertyCode}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
            Agenda & Visitas
          </h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Gerencie suas visitas e compromissos
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#2A070C] hover:bg-[#2A070C]/90 font-[Inter] text-xs uppercase tracking-widest"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Visita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-border/50 shadow-none">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="p-3 pointer-events-auto w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] font-[Inter]",
                  row: "flex w-full mt-2",
                  cell: "h-12 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-12 w-full p-0 font-normal font-[Inter] aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors",
                  day_selected: "bg-[#2A070C] text-white hover:bg-[#2A070C] hover:text-white focus:bg-[#2A070C] focus:text-white",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  caption_label: "text-sm font-semibold font-[Raleway]",
                }}
                modifiers={{
                  hasVisit: visitDates,
                }}
                modifiersClassNames={{
                  hasVisit: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-[#2A070C]",
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Visits */}
          <Card className="bg-white border-border/50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayVisits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-[Inter] text-sm text-muted-foreground/60">
                    Nenhuma visita agendada para este dia.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 font-[Inter] text-xs"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agendar Visita
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <Avatar className="h-10 w-10 bg-[#2A070C]/10">
                        <AvatarFallback className="bg-[#2A070C]/10 text-[#2A070C] font-[Inter] text-xs font-semibold">
                          {getInitials(visit.lead_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-[Inter] text-sm font-medium text-foreground truncate">
                          {visit.lead_name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="font-[Inter] text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visit.visit_time}
                          </span>
                          <Badge variant="outline" className="font-[Inter] text-[10px] px-1.5 py-0">
                            {visit.property_code}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`mailto:${visit.lead_email}`}
                              className="p-1.5 rounded-md hover:bg-accent transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>{visit.lead_email}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`tel:${visit.lead_phone}`}
                              className="p-1.5 rounded-md hover:bg-accent transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>{visit.lead_phone}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={getMapsUrl(visit.property_code)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-accent transition-colors"
                            >
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Abrir no Google Maps</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Check-in Diário */}
          <Card className="bg-white border-border/50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Check-in Diário
              </CardTitle>
              <p className="font-[Inter] text-[10px] text-muted-foreground/60 mt-0.5">
                {format(new Date(), "dd/MM/yyyy")} · {todayVisits.length} visita(s)
              </p>
            </CardHeader>
            <CardContent>
              {todayVisits.length === 0 ? (
                <p className="font-[Inter] text-sm text-muted-foreground/60 text-center py-4">
                  Nenhuma visita hoje.
                </p>
              ) : (
                <ScrollArea className="max-h-[320px]">
                  <div className="space-y-3">
                    {todayVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border/50"
                      >
                        <Avatar className="h-9 w-9 mt-0.5">
                          <AvatarFallback className="bg-[#2A070C]/10 text-[#2A070C] font-[Inter] text-[10px] font-semibold">
                            {getInitials(visit.lead_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-[Inter] text-sm font-medium text-foreground truncate">
                            {visit.lead_name}
                          </p>
                          <p className="font-[Inter] text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {visit.visit_time} · {visit.property_code}
                          </p>
                          <a
                            href={getMapsUrl(visit.property_code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-[Inter] text-[10px] text-[#2A070C] hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver no mapa
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Conectar Agendas */}
          <Card className="bg-white border-border/50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-[Inter] text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Conectar Agendas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-[Inter] text-sm gap-3 h-11"
                    disabled
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google Calendar
                    <Badge variant="secondary" className="ml-auto font-[Inter] text-[9px]">
                      Em breve
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Integração disponível em breve</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-[Inter] text-sm gap-3 h-11"
                    disabled
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M21.17 2H6.83A1.83 1.83 0 005 3.83v16.34A1.83 1.83 0 006.83 22h14.34A1.83 1.83 0 0023 20.17V3.83A1.83 1.83 0 0021.17 2zM12 17.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/>
                      <path fill="#0078D4" d="M1 7h3v10H1z" opacity=".6"/>
                    </svg>
                    Outlook Calendar
                    <Badge variant="secondary" className="ml-auto font-[Inter] text-[9px]">
                      Em breve
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Integração disponível em breve</TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleVisitModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          fetchVisits();
        }}
        propertyCode=""
      />
    </div>
  );
};

export default Agenda;
