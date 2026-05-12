INSERT INTO site_settings (key, value)
VALUES ('condo_menu', '{
  "featured": [
    {
      "name": "Alphaville 1",
      "href": "/busca?condominium=Alphaville+1",
      "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"
    },
    {
      "name": "Tamboré 1",
      "href": "/busca?condominium=Tamboré+1",
      "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop"
    },
    {
      "name": "Gênesis 2",
      "href": "/busca?condominium=Gênesis+2",
      "image": "https://images.unsplash.com/photo-1600607687940-477a128f198e?q=80&w=800&auto=format&fit=crop"
    }
  ],
  "regions": [
    {
      "title": "Alphaville",
      "links": [
        { "name": "Alphaville 1", "href": "/busca?condominium=Alphaville+1" },
        { "name": "Alphaville 2", "href": "/busca?condominium=Alphaville+2" },
        { "name": "Alphaville 11", "href": "/busca?condominium=Alphaville+11" }
      ]
    },
    {
      "title": "Tamboré",
      "links": [
        { "name": "Tamboré 1", "href": "/busca?condominium=Tamboré+1" },
        { "name": "Tamboré 10", "href": "/busca?condominium=Tamboré+10" },
        { "name": "Tamboré 11", "href": "/busca?condominium=Tamboré+11" }
      ]
    },
    {
      "title": "Santana de Parnaíba",
      "links": [
        { "name": "Itahyê", "href": "/busca?condominium=Itahyê" },
        { "name": "Burle Marx", "href": "/busca?condominium=Burle+Marx" }
      ]
    }
  ]
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;