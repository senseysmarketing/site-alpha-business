## Instalar Google Tag Manager

Adicionar o container GTM-54ZGG83N ao site conforme snippet oficial do Google.

### Alterações em `index.html`

1. **No `<head>`** (logo após `<meta name="author">`): adicionar o script do GTM:
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-54ZGG83N');</script>
```

2. **No início do `<body>`**: adicionar o fallback `<noscript>` com iframe:
```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-54ZGG83N"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

O fallback fica no `<body>` (não no `<head>`) para respeitar a restrição de HTML5 sobre `<noscript>` em `<head>`.

### Fora do escopo
- Sem eventos customizados de `dataLayer` — apenas o container base. Rastreamento de eventos específicos (cliques, conversões) fica para uma solicitação futura.
