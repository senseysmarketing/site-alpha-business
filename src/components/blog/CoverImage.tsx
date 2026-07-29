interface CoverImageProps {
  desktop?: string | null;
  mobile?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
}

/**
 * Renderiza a capa da matéria escolhendo automaticamente a versão mobile
 * (quando cadastrada) em telas até 767px, com fallback para a de desktop.
 */
const CoverImage = ({
  desktop,
  mobile,
  alt,
  className = "w-full h-full object-cover",
  fallbackClassName = "w-full h-full bg-gradient-to-br from-bordeaux to-foreground",
  loading = "lazy",
}: CoverImageProps) => {
  if (!desktop && !mobile) {
    return <div className={fallbackClassName} />;
  }

  const desktopSrc = desktop ?? mobile!;
  const mobileSrc = mobile ?? desktopSrc;

  return (
    <picture className="block w-full h-full">
      <source media="(max-width: 767px)" srcSet={mobileSrc} />
      <img src={desktopSrc} alt={alt} loading={loading} className={className} />
    </picture>
  );
};

export default CoverImage;
