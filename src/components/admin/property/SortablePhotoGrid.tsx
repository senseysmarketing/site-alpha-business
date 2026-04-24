import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";

interface SortablePhotoGridProps {
  photos: string[];
  onChange: (next: string[]) => void;
  onRemove: (index: number) => void;
}

interface PhotoCardProps {
  url: string;
  index: number;
  onRemove: () => void;
  isOverlay?: boolean;
}

const PhotoCard = ({ url, index, onRemove, isOverlay }: PhotoCardProps) => {
  const isCover = index === 0;
  return (
    <div
      className={`relative group aspect-square rounded-md overflow-hidden border border-border/50 bg-white ${
        isOverlay ? "scale-105 shadow-2xl ring-2 ring-primary/40" : ""
      }`}
    >
      <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />

      {/* Badge */}
      <div className="absolute top-1.5 left-1.5 z-10">
        {isCover ? (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-[Inter] font-semibold tracking-widest uppercase text-white"
            style={{ backgroundColor: "#1f1f1f" }}
          >
            Capa
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-[Inter] font-semibold text-white bg-stone-500/80 backdrop-blur-sm">
            {index + 1}
          </span>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1.5 right-1.5 z-10 bg-black/70 hover:bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
};

const SortablePhotoCard = ({ url, index, onRemove }: PhotoCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PhotoCard url={url} index={index} onRemove={onRemove} />
    </div>
  );
};

export const SortablePhotoGrid = ({ photos, onChange, onRemove }: SortablePhotoGridProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.indexOf(active.id as string);
    const newIndex = photos.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(photos, oldIndex, newIndex));
  };

  const activeIndex = activeId ? photos.indexOf(activeId) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={photos} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <SortablePhotoCard key={url} url={url} index={i} onRemove={() => onRemove(i)} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId && activeIndex >= 0 ? (
          <PhotoCard url={activeId} index={activeIndex} onRemove={() => {}} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
