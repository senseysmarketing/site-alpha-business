import { Maximize, BedDouble, Bath, Car } from "lucide-react";

interface PropertySpecsProps {
  area: string;
  bedrooms: string;
  suites: string;
  parking: string;
}

const specs = [
  { icon: Maximize, label: "Área", suffix: "m²" },
  { icon: BedDouble, label: "Dormitórios", suffix: "" },
  { icon: Bath, label: "Suítes", suffix: "" },
  { icon: Car, label: "Vagas", suffix: "" },
] as const;

const PropertySpecs = ({ area, bedrooms, suites, parking }: PropertySpecsProps) => {
  const values = [area, bedrooms, suites, parking];

  return (
    <div className="flex items-center divide-x divide-border">
      {specs.map((spec, i) => (
        <div key={spec.label} className="flex items-center gap-2.5 px-5 first:pl-0">
          <spec.icon size={18} className="text-muted-foreground" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="text-body text-sm font-medium text-foreground">
              {values[i]}{spec.suffix}
            </span>
            <span className="text-body text-[11px] text-muted-foreground uppercase tracking-wider">
              {spec.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertySpecs;
