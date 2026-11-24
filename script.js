(function () {
  "use strict";

  /* ==========================================================================
     ECLIPZ — SCRIPT
     O HTML dos cards, carrinho, biblioteca etc. fica nos <template> do
     index.html. Aqui ficam só os dados e a lógica.
     Índice:
     1. Dados            5. Renderização (hero, catálogo, carrinho, biblioteca, modal)
     2. Utilidades       6. Navegação (rotas por hash)
     3. Modelos          7. Ações (cliques e eventos)
     4. Estado           8. Rotação do destaque e inicialização
     ========================================================================== */


  /* 1. DADOS (jogos fictícios) ---------------------------------------------- */

  // Cada jogo tem um campo img com o nome do arquivo (ex.: img: "https://sm.ign.com/ign_br/screenshot/default/tmp-cgtjz0-bb7faa1483782db2-minecraft-horizontal-key-art_n1te.jpg").
  // O arquivo fica na pasta IMG_DIR. Pode usar qualquer nome e extensão (.jpg, .png, .webp)
  // ou um endereço completo (https://...). Se omitir o img, vale ID + IMG_EXT.
  const IMG_DIR = "./img/";
  const IMG_EXT = ".jpg";
  
  // Utiliza os jogos completos de games-data.js (se carregado) ou a lista base abaixo
  const DEFAULT_GAMES = [
    { id: "fifa26", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/header.jpg", title: "EA SPORTS FC 26 (FIFA 26)", dev: "EA Sports", genres: ["Esportes", "Simulação", "Cooperativo"], platforms: ["PC", "PlayStation", "Xbox", "Switch"], price: 349.90, off: 15, rating: 91, year: 2025, feat: 1,
      short: "O maior palco do futebol mundial com gráficos ultrarrealistas e tecnologia HyperMotion V.",
      desc: "EA SPORTS FC 26 traz a mais autêntica experiência dos gramados com mais de 19.000 jogadores licenciados, 700+ equipes e mais de 30 ligas mundiais. Experimente o reformulado Modo Carreira com IA tática de ponta, Ultimate Team dinâmico e disputas multiplayer competitivas." },
    { id: "fifa27", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/header.jpg", title: "EA SPORTS FC 27 (FIFA 27)", dev: "EA Sports", genres: ["Esportes", "Simulação", "Cooperativo"], platforms: ["PC", "PlayStation", "Xbox"], price: 379.90, off: 10, rating: 95, year: 2026, feat: 1,
      short: "A nova fronteira do futebol virtual com física neural e imersão total nos estádios.",
      desc: "Antecipe o futuro do esporte rei com EA SPORTS FC 27. Iluminação volumétrica dinâmica de última geração, capturas de movimentos milimétricas em tempo real, torcidas hiper-reativas e novas ligas mundiais totalmente integradas." },
    { id: "gta6", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg", title: "Grand Theft Auto VI", dev: "Rockstar Games", genres: ["Ação", "Aventura"], platforms: ["PC", "PlayStation", "Xbox"], price: 399.90, off: 0, rating: 99, year: 2026, feat: 1,
      short: "Retorne a Vice City no maior e mais revolucionário mundo aberto da história dos games.",
      desc: "Entre na pele de Lucia e Jason no coração vibrante de Vice City e no ensolarado estado de Leonida. Um nível incomparável de simulação urbana, assaltos espetaculares, física gráfica de ponta e narrativa cinematográfica." },
    { id: "roblox", img: "https://cdn.sanity.io/images/bl383u0v/production/f9c132511044c89c889e37c885f1e6ff2441b000-1920x1080.png", title: "Roblox", dev: "Roblox Corporation", genres: ["Plataforma UGC", "Cooperativo"], platforms: ["PC", "Xbox", "PlayStation", "Mobile"], price: 0, off: 0, rating: 88, year: 2006, feat: 1,
      short: "Milhões de mundos criados pela comunidade, para jogar com amigos.",
      desc: "Plataforma onde qualquer pessoa cria e publica jogos. Explore mundos de aventura, corrida, sobrevivência e simulação, personalize seu avatar e jogue online com amigos em qualquer dispositivo." },
    { id: "minecraft", img: "https://sm.ign.com/ign_br/screenshot/default/tmp-cgtjz0-bb7faa1483782db2-minecraft-horizontal-key-art_n1te.jpg", title: "Minecraft", dev: "Mojang Studios", genres: ["Aventura", "Simulação", "Cooperativo"], platforms: ["PC", "Xbox", "PlayStation", "Switch", "Mobile"], price: 129.9, off: 0, rating: 95, year: 2011, feat: 1,
      short: "Construa, minere e sobreviva em um mundo infinito feito de blocos.",
      desc: "Explore mundos gerados aleatoriamente, colete recursos, crie ferramentas e enfrente criaturas à noite. Jogue sozinho, em servidores ou no modo criativo, sem limites para a imaginação." },
    { id: "zelda", img: "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_2.0/ncom/en_US/merchandising/feature-banner/2026/Zelda%2040th%20Anniversary/Ocarina_of_Time", title: "The Legend of Zelda: Tears of the Kingdom", dev: "Nintendo", genres: ["Aventura", "Ação"], platforms: ["Switch"], price: 349.9, off: 0, rating: 96, year: 2023, feat: 1,
      short: "Link explora os céus e as profundezas de Hyrule em busca de Zelda.",
      desc: "Continuação de Breath of the Wild, com ilhas flutuantes, cavernas profundas e poderes que permitem construir veículos e engenhocas. Um mundo aberto cheio de liberdade e descobertas." },
    { id: "eldenring", img: "https://flowgames.gg/wp-content/uploads/2023/07/9edf816d-5625-45d2-9ef6-8b2ae65bb7eaCover_Elder-Ring.webp", title: "Elden Ring", dev: "FromSoftware", genres: ["RPG", "Ação"], platforms: ["PC", "PlayStation", "Xbox"], price: 249.9, off: 30, rating: 93, year: 2022, feat: 1,
      short: "Um vasto mundo aberto de fantasia sombria criado com George R. R. Martin.",
      desc: "Como Maculado, atravesse as Terras Intermédias, enfrente semideuses e chefes colossais e restaure o Anel Pretérito. Combate exigente, exploração livre e muitas formas de montar seu personagem." },
    { id: "gow", img: "https://meups.com.br/wp-content/uploads/2022/10/Tudo-o-que-ja-foi-revelado-sobre-God-of-War-Ragnarok.jpg", title: "God of War Ragnarök", dev: "Santa Monica Studio", genres: ["Ação", "Aventura"], platforms: ["PlayStation", "PC"], price: 299.9, off: 25, rating: 94, year: 2022, feat: 1,
      short: "Kratos e Atreus enfrentam o fim do mundo na mitologia nórdica.",
      desc: "Viaje pelos nove reinos, lute com o Machado Leviatã e as Lâminas do Caos e descubra o destino de Odin e Thor. Uma história intensa sobre pai e filho, com combate brutal e cinematográfico." },
    { id: "wukong", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/header.jpg", title: "Black Myth: Wukong", dev: "Game Science", genres: ["Ação", "RPG"], platforms: ["PC", "PlayStation"], price: 229.90, off: 20, rating: 96, year: 2024, feat: 1,
      short: "RPG de ação magnífico inspirado na mitologia chinesa e no clássico Jornada ao Oeste.",
      desc: "Assuma o papel do Predestinado e aventure-se por cenários deslumbrantes enfrentando deidades e criaturas lendárias. Domine artes com bastão, transformações e magias ancestrais." },
    { id: "rdr2", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg", title: "Red Dead Redemption 2", dev: "Rockstar Games", genres: ["Ação", "Aventura", "RPG"], platforms: ["PC", "PlayStation", "Xbox"], price: 299.90, off: 67, rating: 97, year: 2018, feat: 1,
      short: "A épica jornada de Arthur Morgan e da gangue Van der Linde no coração dos EUA.",
      desc: "Vencedor de mais de 175 prêmios de Jogo do Ano. Explore um mundo fascinantemente detalhado e vivo no crepúsculo do Velho Oeste, com caçadas, tiroteios e assaltos lendários." },
    { id: "halo", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/1240440/header.jpg", title: "Halo Infinite", dev: "343 Industries", genres: ["Ação"], platforms: ["Xbox", "PC"], price: 0, off: 0, rating: 80, year: 2021, feat: 0,
      short: "O Master Chief volta em uma campanha aberta no anel Zeta Halo.",
      desc: "Campanha em mundo semiaberto com gancho, armas variadas e combate ágil. O multijogador é gratuito, com modos arena e batalha em grande escala." },
    { id: "forza", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg", title: "Forza Horizon 5", dev: "Playground Games", genres: ["Corrida"], platforms: ["Xbox", "PC"], price: 249.9, off: 50, rating: 92, year: 2021, feat: 0,
      short: "Festival de corridas em mundo aberto, no México.",
      desc: "Dirija mais de 500 carros por desertos, selvas, vulcões e cidades. Provas de estrada, terra e corridas online, com clima dinâmico e estações que mudam o mapa." },
    { id: "mariokart", img: "https://files.manuscdn.com/search-media/310519663106396397/qPTzU8GlZcYeFonaEIz6tK/x27V85PujeYfg7nrYQFRbd.jpeg", title: "Mario Kart 8 Deluxe", dev: "Nintendo", genres: ["Corrida", "Cooperativo"], platforms: ["Switch"], price: 299.9, off: 0, rating: 94, year: 2017, feat: 0,
      short: "Corridas malucas com itens, atalhos e os personagens da Nintendo.",
      desc: "Mais de 48 pistas, karts com antigravidade e multijogador local ou online para até 12 jogadores. Fácil de aprender e ótimo para jogar em grupo." },
    { id: "stardew", img: "https://www.notebookcheck.info/fileadmin/_processed_/webp/Notebooks/News/_nc4/Stardew-Valley-2-q82-w2560-h.webp", title: "Stardew Valley", dev: "ConcernedApe", genres: ["Simulação", "Indie", "RPG"], platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"], price: 24.9, off: 0, rating: 98, year: 2016, feat: 0,
      short: "Largue a cidade e reconstrua a fazenda do seu avô.",
      desc: "Plante, crie animais, pesque, explore minas e conquiste a amizade dos moradores do vale. Um jogo relaxante, com estações, festivais e cooperativo para até 4 pessoas." },
    { id: "hollowknight", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg", title: "Hollow Knight", dev: "Team Cherry", genres: ["Indie", "Aventura", "Ação"], platforms: ["PC", "PlayStation", "Xbox", "Switch"], price: 27.5, off: 0, rating: 97, year: 2017, feat: 0,
      short: "Desça ao reino subterrâneo de Hallownest, em um metroidvania desenhado à mão.",
      desc: "Explore cavernas interligadas, enfrente chefes desafiadores e encontre insetos curiosos pelo caminho. Arte em 2D, trilha marcante e exploração sem mapa que segura a sua mão." },
    { id: "bg3", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg", title: "Baldur's Gate 3", dev: "Larian Studios", genres: ["RPG", "Estratégia"], platforms: ["PC", "PlayStation", "Xbox"], price: 199.9, off: 0, rating: 96, year: 2023, feat: 0,
      short: "RPG por turnos de Dungeons & Dragons em que cada escolha importa.",
      desc: "Monte seu grupo, escolha classes e raças e enfrente uma ameaça mental que infecta Faerûn. Combate tático por turnos, diálogos ramificados e cooperativo para até 4 jogadores." },
    { id: "cyberpunk", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg", title: "Cyberpunk 2077", dev: "CD Projekt RED", genres: ["RPG", "Ação"], platforms: ["PC", "PlayStation", "Xbox"], price: 199.9, off: 55, rating: 85, year: 2020, feat: 0,
      short: "Mercenário em Night City, atrás de um chip que promete a imortalidade.",
      desc: "RPG de mundo aberto em primeira pessoa, com tiroteios, hackeamento e implantes cibernéticos. A expansão Phantom Liberty traz espionagem e novas missões." },
    { id: "amongus", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg", title: "Among Us", dev: "Innersloth", genres: ["Cooperativo", "Indie"], platforms: ["PC", "Switch", "Mobile", "PlayStation", "Xbox"], price: 19.9, off: 0, rating: 84, year: 2018, feat: 0,
      short: "Complete as tarefas da nave e descubra quem é o impostor.",
      desc: "Partidas de 4 a 15 jogadores, com tarefas, sabotagens, reuniões de emergência e muita desconfiança. Ótimo para jogar com amigos, no celular ou no PC." },
    { id: "genshin", img: "https://files.manuscdn.com/search-media/310519663106396397/qPTzU8GlZcYeFonaEIz6tK/zoV5zpZjYQpGgj2tSvP544.png", title: "Genshin Impact", dev: "miHoYo", genres: ["RPG", "Aventura"], platforms: ["PC", "PlayStation", "Mobile"], price: 0, off: 0, rating: 86, year: 2020, feat: 0,
      short: "RPG de mundo aberto gratuito, em Teyvat, com combate elemental.",
      desc: "Monte um grupo de personagens com elementos diferentes, explore regiões inspiradas em países reais e combine reações elementais. Jogo gratuito com compras opcionais e modo cooperativo." },
    { id: "clash", img: "https://files.manuscdn.com/search-media/310519663106396397/qPTzU8GlZcYeFonaEIz6tK/na9TVHFybSTUgCLGvSaJ3i.jpg", title: "Clash Royale", dev: "Supercell", genres: ["Estratégia"], platforms: ["Mobile"], price: 0, off: 0, rating: 82, year: 2016, feat: 0,
      short: "Duelos de cartas em tempo real, com torres e tropas.",
      desc: "Monte um deck com seus personagens favoritos e derrube as torres do adversário em partidas rápidas de poucos minutos. Jogo gratuito, com ligas, clãs e torneios." },
    { id: "valorant", img: "https://files.manuscdn.com/search-media/310519663106396397/qPTzU8GlZcYeFonaEIz6tK/B9eCVemhz9GnawtyPZJqTh.jpg", title: "VALORANT", dev: "Riot Games", genres: ["Ação"], platforms: ["PC", "PlayStation", "Xbox"], price: 0, off: 0, rating: 83, year: 2020, feat: 0,
      short: "Tiro tático 5 contra 5 com agentes e habilidades únicas.",
      desc: "Partidas competitivas em que mira precisa se une a poderes especiais. Cada rodada exige estratégia, comunicação e domínio do mapa. Gratuito para jogar." },
    { id: "fortnite", img: "https://files.manuscdn.com/search-media/310519663106396397/qPTzU8GlZcYeFonaEIz6tK/qNFyiD55gMZHMkdkQ2fvp7.jpg", title: "Fortnite", dev: "Epic Games", genres: ["Ação", "Cooperativo"], platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"], price: 0, off: 0, rating: 81, year: 2017, feat: 0,
      short: "Battle royale gratuito com construção, eventos e modos criados pela comunidade.",
      desc: "Salte de um ônibus voador, procure armas e seja o último de pé. Além do battle royale, há modos criativos, shows ao vivo e experiências feitas por outros jogadores." }
  ];

  const GAMES = (window.ECLIPZ_GAMES && Array.isArray(window.ECLIPZ_GAMES) && window.ECLIPZ_GAMES.length)
    ? window.ECLIPZ_GAMES
    : DEFAULT_GAMES;

  const PLATFORMS = ["PC", "PlayStation", "Xbox", "Switch", "Mobile"];

  const CHIPS = [
    { id: "todos", label: "Todos" }, { id: "promo", label: "Em promoção" }, { id: "desejos", label: "Desejados" }
  ].concat(PLATFORMS.map(function (p) { return { id: "plat:" + p, label: p }; })).concat([
    { id: "Esportes", label: "Esportes (FIFA)" }, { id: "Ação", label: "Ação" }, { id: "RPG", label: "RPG" }, { id: "Aventura", label: "Aventura" },
    { id: "Estratégia", label: "Estratégia" }, { id: "Corrida", label: "Corrida" }, { id: "Simulação", label: "Simulação" },
    { id: "Cooperativo", label: "Cooperativo" }, { id: "Indie", label: "Indie" }
  ]);

  // Índice por id, caminho da imagem e preço final já com desconto
  const BY_ID = {};
  GAMES.forEach(function (g) {
    g.img = g.img
      ? (/^(https?:)?\/\/|^\.?\//.test(g.img) ? g.img : IMG_DIR + g.img)
      : IMG_DIR + g.id + IMG_EXT;
    g.final = Math.round(g.price * (100 - g.off)) / 100;
    BY_ID[g.id] = g;
  });
  const FEATURED = GAMES.filter(function (g) { return g.feat; });


  /* 2. UTILIDADES ----------------------------------------------------------- */

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function $(id) { return document.getElementById(id); }
  function money(v) { return brl.format(v).replace(/\u00a0/g, " "); }
  function has(list, id) { return list.indexOf(id) !== -1; }

  // Remove acentos e põe em minúsculas (para a busca)
  function norm(s) {
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Liga/desliga um item da lista. Retorna true se foi adicionado.
  function toggle(list, id) {
    const i = list.indexOf(id);
    if (i === -1) { list.push(id); return true; }
    list.splice(i, 1);
    return false;
  }

  // localStorage com proteção contra erros (modo privado, etc.)
  const store = {
    get: function (k, d) {
      try { const v = localStorage.getItem("eclipz." + k); return v ? JSON.parse(v) : d; }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem("eclipz." + k, JSON.stringify(v)); }
      catch (e) {}
    }
  };

  /* Tema manual ------------------------------------------------------------- */
  function applyTheme(theme) {
    const selected = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", selected);
    store.set("theme", selected);
    const button = $("themeBtn");
    if (button) {
      const light = selected === "light";
      button.setAttribute("aria-label", light ? "Mudar para tema escuro" : "Mudar para tema claro");
      button.setAttribute("title", light ? "Mudar para tema escuro" : "Mudar para tema claro");
      button.querySelector(".theme-icon").textContent = light ? "☾" : "☼";
      button.querySelector(".theme-label").textContent = light ? "Escuro" : "Claro";
    }
  }

  /* Conta demonstrativa ----------------------------------------------------- */
  function accountUser() {
    return store.get("session", null);
  }

  function updateAccountView() {
    const user = accountUser();
    $("loginView").hidden = Boolean(user);
    $("registerView").hidden = true;
    $("accountLogged").hidden = !user;
    $("accountLabel").textContent = user ? user.name : "Entrar";
    if (user) { $("loggedUser").textContent = user.name + " · " + user.email; }
  }

  function openAccount() {
    updateAccountView();
    $("accountModal").hidden = false;
    $("loginEmail").focus();
  }

  function closeAccount() {
    $("accountModal").hidden = true;
  }

  // Substitui o contêiner por uma lista de nós
  function show(container, nodes) {
    container.replaceChildren.apply(container, nodes);
  }


  /* 3. MODELOS (<template> do index.html) ----------------------------------- */

  // Cria uma cópia do modelo
  function clone(id) {
    return $(id).content.cloneNode(true);
  }

  // Preenche a cópia com os dados:
  //   data-text="chave"           -> textContent
  //   data-attr="atributo:chave"  -> atributos (vários separados por ;)
  //   data-width="chave"          -> largura em %
  //   data-slot="chave"           -> troca o elemento por outro nó (ou função que gera o nó)
  function fill(root, d) {
    root.querySelectorAll("[data-text]").forEach(function (el) {
      el.textContent = d[el.getAttribute("data-text")];
    });

    root.querySelectorAll("[data-attr]").forEach(function (el) {
      el.getAttribute("data-attr").split(";").forEach(function (pair) {
        const kv = pair.split(":");
        el.setAttribute(kv[0].trim(), d[kv[1].trim()]);
      });
    });

    root.querySelectorAll("[data-width]").forEach(function (el) {
      el.style.width = d[el.getAttribute("data-width")] + "%";
    });

    // Por último, para não reprocessar os nós que entram no lugar dos slots
    root.querySelectorAll("[data-slot]").forEach(function (el) {
      let v = d[el.getAttribute("data-slot")];
      if (typeof v === "function") { v = v(); }
      if (v) { el.replaceWith(v); } else { el.remove(); }
    });

    return root;
  }

  // Clona e preenche de uma vez
  function build(id, d) {
    return fill(clone(id), d);
  }

  // Imagem que não existe: esconde o ícone quebrado e deixa o fundo do contêiner
  document.addEventListener("error", function (e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains("art-img")) { t.style.visibility = "hidden"; }
  }, true);


  /* 4. ESTADO --------------------------------------------------------------- */

  // Descarta ids que não existem mais no catálogo (dados antigos do localStorage)
  function valid(list) {
    return list.filter(function (id) { return BY_ID[id]; });
  }

  const state = {
    // Persistidos no localStorage
    cart: valid(store.get("cart", [])),
    wish: valid(store.get("wish", ["eldenring"])),
    owned: valid(store.get("owned", ["stardew", "hollowknight"])),
    installed: valid(store.get("installed", ["stardew"])),
    // Só em memória
    installing: {},
    filter: "todos",
    query: "",
    sort: "rel",
    hero: 0,
    view: "loja",
    modalId: null
  };

  function save() {
    store.set("cart", state.cart);
    store.set("wish", state.wish);
    store.set("owned", state.owned);
    store.set("installed", state.installed);
  }


  /* 5. RENDERIZAÇÃO --------------------------------------------------------- */

  /* --- Peças reutilizáveis --- */

  function ratingLabel(g) {
    return g.rating >= 90 ? "Muito positivas" : g.rating >= 80 ? "Positivas" : "Mistas";
  }

  function priceNode(g) {
    if (g.price === 0) { return clone("tpl-price-free"); }
    if (g.off) {
      return build("tpl-price-off", { off: "-" + g.off + "%", was: money(g.price), now: money(g.final) });
    }
    return build("tpl-price", { now: money(g.final) });
  }

  function addNode(g) {
    if (has(state.owned, g.id)) { return clone("tpl-btn-owned"); }
    if (has(state.cart, g.id)) { return clone("tpl-btn-incart"); }
    return build("tpl-btn-add", { id: g.id, label: g.price === 0 ? "Obter grátis" : "Adicionar" });
  }

  function wishNode(g) {
    const on = has(state.wish, g.id);
    return build("tpl-wish", {
      id: g.id,
      pressed: on,
      label: (on ? "Remover " : "Desejar ") + g.title + (on ? " da lista de desejos" : "")
    });
  }

  // Dados de um jogo prontos para os modelos (os slots só são gerados se o modelo usar)
  function info(g) {
    return {
      id: g.id,
      img: g.img,
      title: g.title,
      short: g.short,
      desc: g.desc,
      dev: g.dev,
      year: g.year,
      genres: g.genres.join(" · "),
      genresComma: g.genres.join(", "),
      platforms: g.platforms.join(" · "),
      tags: g.genres.join(" · ") + " · " + g.year,
      devMeta: g.dev + " · " + g.genres.join(" · "),
      ratingShort: g.rating + "% " + ratingLabel(g).toLowerCase(),
      ratingPct: g.rating + "% positivas",
      ratingLabel: ratingLabel(g),
      openLabel: "Ver detalhes de " + g.title,
      removeLabel: "Remover " + g.title + " do carrinho",
      price: function () { return priceNode(g); },
      add: function () { return addNode(g); },
      wish: function () { return wishNode(g); }
    };
  }

  /* --- Destaque --- */

  function renderHero() {
    show($("stage"), [build("tpl-stage", info(FEATURED[state.hero]))]);

    show($("picks"), FEATURED.map(function (f, i) {
      const d = info(f);
      d.index = i;
      d.current = i === state.hero;
      return build("tpl-pick", d);
    }));
  }

  /* --- Catálogo --- */

  function matches(g) {
    const f = state.filter;
    if (f === "promo" && !g.off) { return false; }
    if (f === "desejos" && !has(state.wish, g.id)) { return false; }
    if (f.indexOf("plat:") === 0) {
      if (!has(g.platforms, f.slice(5))) { return false; }
    } else if (f !== "todos" && f !== "promo" && f !== "desejos" && !has(g.genres, f)) { return false; }
    if (state.query) {
      const text = norm(g.title + " " + g.dev + " " + g.genres.join(" "));
      if (text.indexOf(norm(state.query)) === -1) { return false; }
    }
    return true;
  }

  const SORTERS = {
    preco: function (a, b) { return a.final - b.final; },
    desc: function (a, b) { return b.off - a.off || b.rating - a.rating; },
    nota: function (a, b) { return b.rating - a.rating; },
    az: function (a, b) { return a.title.localeCompare(b.title, "pt-BR"); },
    rel: function (a, b) { return (b.feat - a.feat) || (b.rating - a.rating); }
  };

  function renderChips() {
    show($("chips"), CHIPS.map(function (c) {
      return build("tpl-chip", {
        id: c.id,
        pressed: state.filter === c.id,
        label: c.label + (c.id === "desejos" ? " (" + state.wish.length + ")" : "")
      });
    }));
  }

  function renderGrid() { 
    const list = GAMES.filter(matches).sort(SORTERS[state.sort] || SORTERS.rel);
    show($("grid"), list.map(function (g) { return build("tpl-card", info(g)); }));
    $("empty").hidden = list.length > 0;
    $("resultCount").textContent = list.length + (list.length === 1 ? " jogo" : " jogos");
  }

  /* --- Carrinho --- */

  function renderCart() {
    let total = 0;
    state.cart.forEach(function (id) { total += BY_ID[id].final; });

    show($("cartList"), state.cart.length
      ? state.cart.map(function (id) { return build("tpl-cart-item", info(BY_ID[id])); })
      : [clone("tpl-cart-empty")]);

    $("cartTotal").textContent = money(total);
    $("cartCount").textContent = state.cart.length;
    $("checkout").disabled = !state.cart.length;
  }

  /* --- Biblioteca --- */

  function libItemNode(id) {
    const g = BY_ID[id], d = info(g);

    if (has(state.installed, id)) {
      d.action = clone("tpl-lib-play");
      fill(d.action, { id: id });
    } else if (state.installing[id] !== undefined) {
      d.action = clone("tpl-lib-installing");
      d.progress = build("tpl-lib-progress", { value: Math.min(100, state.installing[id]) });
    } else {
      d.action = clone("tpl-lib-install");
      fill(d.action, { id: id });
    }

    return build("tpl-lib-item", d);
  }

  function renderLibrary() {
    const owned = state.owned.length, installed = state.installed.length;
    $("libCount").textContent = owned ? owned : "";
    $("libSub").textContent = owned + (owned === 1 ? " jogo" : " jogos") + " · " + installed + " instalado" + (installed === 1 ? "" : "s");
    $("libEmpty").hidden = owned > 0;
    show($("libList"), state.owned.map(libItemNode));
  }

  /* --- Modal de detalhes e gaveta --- */

  function renderModal() {
    const g = BY_ID[state.modalId];
    if (!g) { return; }
    show($("sheet"), [build("tpl-modal", info(g))]);
  }

  function openModal(id) {
    state.modalId = id;
    renderModal();
    $("modal").hidden = false;
    $("scrim").hidden = false;
    const close = $("sheet").querySelector(".close");
    if (close) { close.focus(); }
  }

  function openCart() {
    $("modal").hidden = true;
    $("drawer").hidden = false;
    $("scrim").hidden = false;
    $("cartBtn").setAttribute("aria-expanded", "true");
    const close = $("drawer").querySelector(".icon-btn");
    if (close) { close.focus(); }
  }

  function closeAll() {
    $("modal").hidden = true;
    $("drawer").hidden = true;
    $("scrim").hidden = true;
    state.modalId = null;
    $("cartBtn").setAttribute("aria-expanded", "false");
  }

  /* --- Toast e render geral --- */

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function renderAll() {
    renderHero();
    renderChips();
    renderGrid();
    renderCart();
    renderLibrary();
    if (state.modalId && !$("modal").hidden) { renderModal(); }
  }


  /* 6. NAVEGAÇÃO (rotas por hash) ------------------------------------------- */

  function route() {
    state.view = location.hash.slice(1) === "biblioteca" ? "biblioteca" : "loja";
    $("view-loja").hidden = state.view !== "loja";
    $("view-biblioteca").hidden = state.view !== "biblioteca";
    $("nav-loja").setAttribute("aria-current", state.view === "loja" ? "page" : "false");
    $("nav-biblioteca").setAttribute("aria-current", state.view === "biblioteca" ? "page" : "false");
    closeAll();
    window.scrollTo(0, 0);
  }


  /* 7. AÇÕES (cliques e eventos) -------------------------------------------- */

  // Cada ação recebe o id do jogo (data-id) e o elemento clicado
  const ACTIONS = {
    open: function (id) { openModal(id); },
    close: function () { closeAll(); },
    cart: function () { openCart(); },

    hero: function (id, el) {
      state.hero = +el.getAttribute("data-i");
      renderHero();
    },

    chip: function (id) {
      state.filter = id;
      renderChips();
      renderGrid();
    },

    add: function (id) {
      const g = BY_ID[id];
      if (g.price === 0) {
        state.owned.push(id);
        toast(g.title + " foi para a biblioteca.");
      } else {
        state.cart.push(id);
        toast(g.title + " no carrinho.");
      }
      save();
      renderAll();
    },

    remove: function (id) {
      toggle(state.cart, id);
      save();
      renderAll();
    },

    wish: function (id) {
      const added = toggle(state.wish, id);
      save();
      renderAll();
      toast(added ? "Adicionado à lista de desejos." : "Removido da lista de desejos.");
    },

    checkout: function () {
      const n = state.cart.length;
      if (!n) { return; }
      state.cart.forEach(function (id) {
        if (!has(state.owned, id)) { state.owned.push(id); }
        state.wish = state.wish.filter(function (w) { return w !== id; });
      });
      state.cart = [];
      save();
      renderAll();
      closeAll();
      toast("Compra simulada concluída: " + n + (n === 1 ? " jogo" : " jogos") + " na biblioteca.");
      location.hash = "biblioteca";
    },

    install: function (id) {
      state.installing[id] = 0;
      renderLibrary();
      const timer = setInterval(function () {
        state.installing[id] += 10 + Math.round(Math.random() * 12);
        if (state.installing[id] >= 100) {
          clearInterval(timer);
          delete state.installing[id];
          state.installed.push(id);
          save();
        }
        renderLibrary();
      }, 350);
    },

    play: function (id) {
      toast(BY_ID[id].title + " é um jogo fictício. Esta é só uma demonstração.");
    }
  };

  document.addEventListener("click", function (e) {
    // Clique no fundo escuro fecha modal e gaveta
    if (e.target === $("scrim") || e.target === $("modal")) { closeAll(); return; }

    const el = e.target.closest("[data-act]");
    if (!el) { return; }
    const run = ACTIONS[el.getAttribute("data-act")];
    if (run) { run(el.getAttribute("data-id"), el); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(); closeAccount(); }
  });

  $("cartBtn").addEventListener("click", openCart);
  $("themeBtn").addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });
  $("accountBtn").addEventListener("click", openAccount);
  $("accountClose").addEventListener("click", closeAccount);
  $("accountModal").addEventListener("click", function (e) {
    if (e.target === $("accountModal")) { closeAccount(); }
  });
  $("showRegister").addEventListener("click", function () {
    $("loginView").hidden = true;
    $("registerView").hidden = false;
    $("registerName").focus();
  });
  $("showLogin").addEventListener("click", function () {
    $("registerView").hidden = true;
    $("loginView").hidden = false;
    $("loginEmail").focus();
  });
  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const account = store.get("account", null);
    if (!account || account.email !== email || account.password !== password) {
      toast("E-mail ou senha incorretos.");
      return;
    }
    store.set("session", { name: account.name, email: account.email });
    updateAccountView();
    $("loginForm").reset();
    toast("Login realizado com sucesso.");
  });
  $("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim().toLowerCase();
    const password = $("registerPassword").value;
    store.set("account", { name: name, email: email, password: password });
    store.set("session", { name: name, email: email });
    updateAccountView();
    $("registerForm").reset();
    toast("Conta criada com sucesso.");
  });
  $("logoutBtn").addEventListener("click", function () {
    store.set("session", null);
    updateAccountView();
    toast("Você saiu da conta.");
  });

  $("q").addEventListener("input", function (e) {
    state.query = e.target.value.trim();
    if (state.view !== "loja") { location.hash = "loja"; }
    renderGrid();
  });

  $("sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    renderGrid();
  });

  window.addEventListener("hashchange", route);


  /* 8. ROTAÇÃO DO DESTAQUE E INICIALIZAÇÃO ---------------------------------- */

  applyTheme(store.get("theme", "dark"));
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let heroPaused = false;
  const heroEl = document.querySelector(".hero");

  // Pausa a rotação enquanto o mouse ou o foco estão no destaque
  heroEl.addEventListener("mouseenter", function () { heroPaused = true; });
  heroEl.addEventListener("mouseleave", function () { heroPaused = false; });
  heroEl.addEventListener("focusin", function () { heroPaused = true; });
  heroEl.addEventListener("focusout", function () { heroPaused = false; });

  if (!reduceMotion) {
    setInterval(function () {
      const busy = state.view !== "loja" || !$("modal").hidden || !$("drawer").hidden;
      if (heroPaused || busy) { return; }
      state.hero = (state.hero + 1) % FEATURED.length;
      renderHero();
    }, 6500);
  }

  renderAll();
  route();
})();
