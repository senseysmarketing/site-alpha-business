

## Editor de Blog — Upload de Imagens Inline (Word-like)

Adicionar suporte completo a imagens dentro do corpo do artigo, com três métodos de inserção: **arrastar e soltar**, **colar (Ctrl+V)** e **botão da toolbar**. Cada imagem vira automaticamente um `![alt](url)` no markdown, que o renderer (`renderMarkdownContent`) já exibe corretamente.

### 1. Hook de upload reutilizável

Criar `src/hooks/useBlogImageUpload.ts`:
- Função `uploadImage(file: File): Promise<string>`.
- Valida tipo (`image/*`) e tamanho (máx 10MB).
- Path: `inline/${Date.now()}-${random}.${ext}` no bucket `blog-media` (já existe e é público).
- Retorna a `publicUrl` pronta para markdown.
- Toast de erro se falhar.

### 2. Inserção inline na textarea (`BlogEditor.tsx`)

Adicionar handlers no `<textarea>`:

**Paste** (`onPaste`):
- Percorre `e.clipboardData.items`, detecta `kind === "file"` e `type.startsWith("image/")`.
- Se houver imagem: `e.preventDefault()`, insere placeholder `![enviando...]()` na posição do cursor, faz upload, substitui pelo `![imagem](url-real)`.

**Drop** (`onDrop` + `onDragOver`):
- Detecta arquivos de imagem em `e.dataTransfer.files`.
- Mesmo fluxo: placeholder + upload + replace.
- Visual: borda tracejada sutil aparece quando `isDragging` (estado local) sobre a textarea.

**Helper compartilhado** `insertAtCursor(text)` que reutiliza a lógica já existente de manipulação de seleção (`selectionStart`/`selectionEnd`).

### 3. Botão "Imagem" na toolbar

Em `EditorToolbar.tsx`, o botão `Image` já existe mas insere `![](url)` literal. Trocar comportamento:
- Abre file picker (`<input type="file" accept="image/*">`).
- Usa o mesmo `useBlogImageUpload` + callback `onInsertImage(url)` passado via prop.
- Adicionar prop opcional `onUploadImage?: (file: File) => Promise<string>` ao `EditorToolbar` para manter o componente desacoplado.
- Manter o botão também no bubble menu de seleção.

### 4. Feedback visual

- Durante upload: placeholder `![enviando...]()` visível no markdown (e renderizado como link quebrado no preview — aceitável, dura ~1-2s).
- Toast de sucesso discreto ("Imagem inserida") opcional.
- Toast de erro se upload falhar, e o placeholder é removido.

### 5. Renderização

Nenhuma mudança necessária em `src/lib/markdown.tsx` — já parseia `![alt](url)` (regex de imagens já presente via parsing inline). Verificação rápida: o regex atual cobre `[texto](url)` mas **não** `![alt](url)` — precisa adicionar um caso para imagem antes do caso de link no `parseInline`, gerando `<img src={url} alt={alt} className="rounded-lg my-6 w-full" />`.

### Compatibilidade com o que já existe

- Bucket `blog-media` já configurado (usado pelo cover image).
- RLS já permite admin escrever / público ler.
- O `PostPreview` usa o mesmo renderer, então as imagens aparecem na pré-visualização.
- A página pública `BlogPost.tsx` também usa `renderMarkdownContent` — imagens aparecem automaticamente no artigo publicado.

### Arquivos editados

- `src/hooks/useBlogImageUpload.ts` (novo)
- `src/pages/admin/BlogEditor.tsx` (handlers paste/drop + integração)
- `src/components/admin/blog/EditorToolbar.tsx` (botão Imagem com upload real)
- `src/lib/markdown.tsx` (suporte a `![alt](url)` no parseInline)
- `mem://features/admin/blog-cms` (registrar funcionalidade de imagens inline)

