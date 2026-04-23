import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function useBlogImageUpload() {
  const { toast } = useToast();

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Apenas imagens são permitidas.", variant: "destructive" });
      return null;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "Imagem muito grande", description: "Tamanho máximo: 10MB.", variant: "destructive" });
      return null;
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `inline/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("blog-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    return data.publicUrl;
  }, [toast]);

  return { uploadImage };
}
