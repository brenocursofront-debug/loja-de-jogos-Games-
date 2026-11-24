/* ==========================================================================
   ECLIPZ GAMES — SCRIPT DA PÁGINA DE JOGOS (INSPIRADO NA STEAM)
   Gerencia catálogo completo, filtros avançados, visualização Lista/Grade Steam,
   carrinho, lista de desejos, modal de detalhes e spotlight interativo.
   ========================================================================== */

(function () {
  "use strict";

  /* 1. DADOS E UTILIDADES --------------------------------------------------- */

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(v) { return brl.format(v).replace(/\u00a0/g, " "); }
  function $(id) { return document.getElementById(id); }
  function has(list, id) { return list.indexOf(id) !== -1; }

  // Normalização de texto para busca insensível a acentos
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // LocalStorage seguro
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

  // Garante acesso aos jogos de games-data.js
  const GAMES = (window.ECLIPZ_GAMES && Array.isArray(window.ECLIPZ_GAMES) && window.ECLIPZ_GAMES.length)
    ? window.ECLIPZ_GAMES
    : [];

  const BY_ID = {};
  GAMES.forEach(function (g) {
    g.final = Math.round(g.price * (100 - (g.off || 0))) / 100;
    BY_ID[g.id] = g;
  });

  // Lista de jogos destacados para o carrossel/spotlight Steam
  const SPOTLIGHT_GAMES = GAMES.filter(function (g) { return g.feat; });
  if (!SPOTLIGHT_GAMES.length && GAMES.length) {
    SPOTLIGHT_GAMES.push(GAMES[0]);
  }

  /* 2. ESTADO DA PÁGINA ----------------------------------------------------- */

  function valid(list) {
    return (list || []).filter(function (id) { return BY_ID[id]; });
  }

  const state = {
    cart: valid(store.get("cart", [])),
    wish: valid(store.get("wish", ["fifa26", "eldenring", "gta6"])),
    owned: valid(store.get("owned", ["stardew", "hollowknight"])),
    installed: valid(store.get("installed", ["stardew"])),
    
    // Filtros
    query: "",
    genre: "todos",
    price: "todos",
    platform: "todos",
    tab: "todos",
    sort: "rel",
    view: store.get("steamView", "list"), // 'list' ou 'grid'
    
    // Spotlight
    spotlightIndex: 0,
    modalId: null
  };

  function save() {
    store.set("cart", state.cart);
    store.set("wish", state.wish);
    store.set("owned", state.owned);
    store.set("installed", state.installed);
    updateHeaderCounts();
  }

  /* 3. TEMA E CONTA --------------------------------------------------------- */

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

  /* 4. TOAST NOTIFICAÇÃO ---------------------------------------------------- */

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* 5. ÍCONES DE PLATAFORMA STEAM ------------------------------------------- */

  function platformIcons(platforms) {
    return platforms.map(function (p) {
      switch (p) {
        case "PC":
          return '<span title="Windows PC"><i class="fa-brands fa-windows"></i></span>';
        case "PlayStation":
          return '<span title="PlayStation"><i class="fa-brands fa-playstation"></i></span>';
        case "Xbox":
          return '<span title="Xbox"><i class="fa-brands fa-xbox"></i></span>';
        case "Switch":
          return '<span title="Nintendo Switch"><i class="fa-solid fa-gamepad"></i></span>';
        case "Mobile":
          return '<span title="Dispositivos Móveis"><i class="fa-solid fa-mobile-screen"></i></span>';
        default:
          return '<span>' + p + '</span>';
      }
    }).join(" ");
  }

  function reviewLabel(rating) {
    if (rating >= 95) return "Extremamente Positivas (" + rating + "%)";
    if (rating >= 88) return "Muito Positivas (" + rating + "%)";
    if (rating >= 80) return "Positivas (" + rating + "%)";
    return "Neutras / Mistas (" + rating + "%)";
  }

  /* 6. SPOTLIGHT STEAM (HERO) ----------------------------------------------- */

  function renderSpotlight() {
    if (!SPOTLIGHT_GAMES.length) return;
    const g = SPOTLIGHT_GAMES[state.spotlightIndex] || SPOTLIGHT_GAMES[0];

    $("spotlightImg").src = g.img;
    $("spotlightImg").alt = g.title;
    $("spotlightTitle").textContent = g.title;
    $("spotlightDesc").textContent = g.short || g.desc;
    $("spotlightRating").textContent = reviewLabel(g.rating);
    $("spotlightDev").textContent = g.dev;
    $("spotlightYear").textContent = g.year;

    // Tags
    $("spotlightTags").innerHTML = g.genres.map(function (genre) {
      return '<span class="steam-tag">' + genre + '</span>';
    }).join("");

    // Preço Steam
    let priceHtml = "";
    if (g.price === 0) {
      priceHtml = '<div class="steam-price-block"><div class="steam-price-values"><span class="steam-final-price free">Gratuito para Jogar</span></div></div>';
    } else if (g.off > 0) {
      priceHtml = '<div class="steam-price-block">' +
        '<span class="steam-discount-tag">-' + g.off + '%</span>' +
        '<div class="steam-price-values">' +
          '<span class="steam-old-price">' + money(g.price) + '</span>' +
          '<span class="steam-final-price">' + money(g.final) + '</span>' +
        '</div>' +
      '</div>';
    } else {
      priceHtml = '<div class="steam-price-block"><div class="steam-price-values"><span class="steam-final-price">' + money(g.final) + '</span></div></div>';
    }
    $("spotlightPriceBlock").innerHTML = priceHtml;

    // Botão Adicionar
    const isOwned = has(state.owned, g.id);
    const inCart = has(state.cart, g.id);
    const buyBtn = $("spotlightBuyBtn");
    if (isOwned) {
      buyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Na Biblioteca';
      buyBtn.disabled = true;
      buyBtn.style.opacity = "0.7";
    } else if (inCart) {
      buyBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> No Carrinho';
      buyBtn.disabled = false;
      buyBtn.style.opacity = "1";
    } else {
      buyBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> ' + (g.price === 0 ? "Obter Grátis" : "Adicionar");
      buyBtn.disabled = false;
      buyBtn.style.opacity = "1";
    }

    // Miniaturas
    $("spotlightThumbs").innerHTML = SPOTLIGHT_GAMES.map(function (sg, idx) {
      const activeClass = idx === state.spotlightIndex ? "active" : "";
      return '<div class="steam-spotlight-thumb ' + activeClass + '" data-spotlight-i="' + idx + '" title="' + sg.title + '">' +
        '<img src="' + sg.img + '" alt="' + sg.title + '">' +
      '</div>';
    }).join("");
  }

  /* 7. FILTROS E BUSCA ------------------------------------------------------ */

  // Lista todos os gêneros únicos para gerar a lista na barra lateral
  function initGenreFilters() {
    const genreMap = {};
    GAMES.forEach(function (g) {
      g.genres.forEach(function (genre) {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    const genres = Object.keys(genreMap).sort(function (a, b) {
      if (a === "Esportes") return -1;
      if (b === "Esportes") return 1;
      return genreMap[b] - genreMap[a];
    });

    let html = '<button class="steam-filter-item ' + (state.genre === "todos" ? "active" : "") + '" type="button" data-genre="todos">Todos os Gêneros <span class="count">' + GAMES.length + '</span></button>';
    genres.forEach(function (genre) {
      const activeClass = state.genre === genre ? "active" : "";
      const isFIFA = genre === "Esportes" ? " ⚽" : "";
      html += '<button class="steam-filter-item ' + activeClass + '" type="button" data-genre="' + genre + '">' + genre + isFIFA + ' <span class="count">' + genreMap[genre] + '</span></button>';
    });

    $("genreFilterList").innerHTML = html;
  }

  function matches(g) {
    // 1. Aba Rápida Steam
    if (state.tab === "fifa" && !has(g.genres, "Esportes") && g.id.indexOf("fifa") === -1) {
      return false;
    }
    if (state.tab === "promo" && !g.off) {
      return false;
    }
    if (state.tab === "mais-vendidos" && g.rating < 90) {
      return false;
    }
    if (state.tab === "gratis" && g.price !== 0) {
      return false;
    }

    // 2. Gênero
    if (state.genre !== "todos" && !has(g.genres, state.genre)) {
      return false;
    }

    // 3. Preço
    if (state.price === "free" && g.price !== 0) return false;
    if (state.price === "under50" && (g.final > 50 || g.price === 0)) return false;
    if (state.price === "under150" && g.final > 150) return false;
    if (state.price === "under250" && g.final > 250) return false;
    if (state.price === "promo" && !g.off) return false;

    // 4. Plataforma
    if (state.platform !== "todos" && !has(g.platforms, state.platform)) {
      return false;
    }

    // 5. Busca por texto
    if (state.query) {
      const q = norm(state.query);
      const text = norm(g.title + " " + g.dev + " " + g.genres.join(" ") + " " + (g.year || ""));
      if (text.indexOf(q) === -1) return false;
    }

    return true;
  }

  const SORTERS = {
    rel: function (a, b) { return (b.feat - a.feat) || (b.rating - a.rating) || (b.year - a.year); },
    precoAsc: function (a, b) { return a.final - b.final; },
    precoDesc: function (a, b) { return b.final - a.final; },
    desc: function (a, b) { return (b.off || 0) - (a.off || 0) || (b.rating - a.rating); },
    nota: function (a, b) { return b.rating - a.rating; },
    lancamento: function (a, b) { return b.year - a.year || b.rating - a.rating; },
    az: function (a, b) { return a.title.localeCompare(b.title, "pt-BR"); }
  };

  /* 8. RENDERIZAÇÃO DO CATÁLOGO (LISTA OU GRADE STEAM) ---------------------- */

  function renderCatalog() {
    const filtered = GAMES.filter(matches);
    const sorter = SORTERS[state.sort] || SORTERS.rel;
    filtered.sort(sorter);

    const container = $("steamGamesContainer");
    $("steamResultCount").innerHTML = "Mostrando <strong>" + filtered.length + "</strong> " + (filtered.length === 1 ? "jogo encontrado" : "jogos encontrados");
    $("steamEmpty").hidden = filtered.length > 0;

    if (state.view === "list") {
      container.className = "steam-list";
      container.innerHTML = filtered.map(renderSteamRow).join("");
    } else {
      container.className = "steam-grid";
      container.innerHTML = filtered.map(renderSteamCard).join("");
    }
  }

  function priceBadge(g) {
    if (g.price === 0) {
      return '<div class="steam-price-block"><div class="steam-price-values"><span class="steam-final-price free">Grátis</span></div></div>';
    }
    if (g.off > 0) {
      return '<div class="steam-price-block">' +
        '<span class="steam-discount-tag">-' + g.off + '%</span>' +
        '<div class="steam-price-values">' +
          '<span class="steam-old-price">' + money(g.price) + '</span>' +
          '<span class="steam-final-price">' + money(g.final) + '</span>' +
        '</div>' +
      '</div>';
    }
    return '<div class="steam-price-block"><div class="steam-price-values"><span class="steam-final-price">' + money(g.final) + '</span></div></div>';
  }

  function renderSteamRow(g) {
    const isOwned = has(state.owned, g.id);
    const inCart = has(state.cart, g.id);
    const isWish = has(state.wish, g.id);

    let actionBtn = "";
    if (isOwned) {
      actionBtn = '<button class="btn" disabled style="padding: 7px 12px; font-size: 13px; background: var(--surface-2); color: var(--muted);"><i class="fa-solid fa-check"></i> Na Biblioteca</button>';
    } else if (inCart) {
      actionBtn = '<button class="btn ghost" data-act="openCart" style="padding: 7px 12px; font-size: 13px;"><i class="fa-solid fa-bag-shopping"></i> No Carrinho</button>';
    } else {
      actionBtn = '<button class="steam-buy-btn" data-act="buy" data-id="' + g.id + '" style="padding: 7px 13px; font-size: 13px;">' +
        '<i class="fa-solid fa-cart-shopping"></i> ' + (g.price === 0 ? "Obter" : "Adicionar") +
      '</button>';
    }

    const wishClass = isWish ? 'color: var(--deal); border-color: var(--deal);' : '';

    return '<article class="steam-row" data-id="' + g.id + '">' +
      '<div class="steam-row-capsule" data-act="modal" data-id="' + g.id + '">' +
        '<img src="' + g.img + '" alt="' + g.title + '" loading="lazy">' +
      '</div>' +
      '<div class="steam-row-details">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">' +
          '<a class="steam-row-title" data-act="modal" data-id="' + g.id + '">' + g.title + '</a>' +
          '<span class="steam-review-badge" style="font-size: 11px;">' + reviewLabel(g.rating) + '</span>' +
        '</div>' +
        '<div class="steam-row-meta">' +
          '<span class="steam-row-platforms">' + platformIcons(g.platforms) + '</span>' +
          '<span>•</span>' +
          '<span>' + g.genres.join(" · ") + '</span>' +
          '<span>•</span>' +
          '<span>' + g.year + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="steam-row-right">' +
        priceBadge(g) +
        actionBtn +
        '<button class="icon-btn" type="button" data-act="wish" data-id="' + g.id + '" style="width: 34px; height: 34px; font-size: 14px; ' + wishClass + '" title="Salvar na lista de desejos">' +
          '<i class="' + (isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart') + '"></i>' +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function renderSteamCard(g) {
    const isOwned = has(state.owned, g.id);
    const inCart = has(state.cart, g.id);
    const isWish = has(state.wish, g.id);

    let actionBtn = "";
    if (isOwned) {
      actionBtn = '<button class="btn" disabled style="padding: 6px 10px; font-size: 12px; background: var(--surface-2); color: var(--muted);"><i class="fa-solid fa-check"></i> Na Biblioteca</button>';
    } else if (inCart) {
      actionBtn = '<button class="btn ghost" data-act="openCart" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-bag-shopping"></i> No Carrinho</button>';
    } else {
      actionBtn = '<button class="steam-buy-btn" data-act="buy" data-id="' + g.id + '" style="padding: 6px 12px; font-size: 12px;">' +
        '<i class="fa-solid fa-cart-shopping"></i> ' + (g.price === 0 ? "Obter" : "Comprar") +
      '</button>';
    }

    const wishClass = isWish ? 'color: var(--deal); border-color: var(--deal);' : '';

    return '<article class="steam-card" data-id="' + g.id + '">' +
      '<div class="steam-card-thumb" data-act="modal" data-id="' + g.id + '">' +
        '<img src="' + g.img + '" alt="' + g.title + '" loading="lazy">' +
      '</div>' +
      '<div class="steam-card-body">' +
        '<h3 data-act="modal" data-id="' + g.id + '">' + g.title + '</h3>' +
        '<div style="font-size: 12px; color: #8f98a0; display: flex; align-items: center; justify-content: space-between;">' +
          '<span>' + g.genres[0] + (g.genres[1] ? " · " + g.genres[1] : "") + '</span>' +
          '<span>' + platformIcons(g.platforms) + '</span>' +
        '</div>' +
        '<div style="font-size: 11px; color: #66c0f4;">' + reviewLabel(g.rating) + '</div>' +
        '<div class="steam-card-foot">' +
          priceBadge(g) +
          '<div style="display: flex; gap: 6px;">' +
            '<button class="icon-btn" type="button" data-act="wish" data-id="' + g.id + '" style="width: 32px; height: 32px; font-size: 13px; ' + wishClass + '" title="Desejar">' +
              '<i class="' + (isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart') + '"></i>' +
            '</button>' +
            actionBtn +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* 9. CARRINHO (GAVETA SINCRONIZADA) --------------------------------------- */

  function renderCart() {
    let total = 0;
    state.cart.forEach(function (id) {
      if (BY_ID[id]) total += BY_ID[id].final;
    });

    const listEl = $("cartList");
    if (!state.cart.length) {
      listEl.innerHTML = '<li class="empty">Seu carrinho está vazio.<br>Adicione jogos explorando o catálogo Steam.</li>';
    } else {
      listEl.innerHTML = state.cart.map(function (id) {
        const g = BY_ID[id];
        return '<li class="line-item">' +
          '<span class="thumb"><img class="art-img" src="' + g.img + '" alt="' + g.title + '" loading="lazy"></span>' +
          '<div class="info">' +
            '<strong>' + g.title + '</strong>' +
            '<span class="price"><span class="now">' + (g.price === 0 ? "Grátis" : money(g.final)) + '</span></span>' +
          '</div>' +
          '<button class="icon-btn" type="button" data-act="removeFromCart" data-id="' + g.id + '" aria-label="Remover do carrinho">' +
            '<i class="fa-solid fa-xmark"></i>' +
          '</button>' +
        '</li>';
      }).join("");
    }

    $("cartTotal").textContent = money(total);
    $("cartCount").textContent = state.cart.length;
    $("checkoutBtn").disabled = !state.cart.length;
  }

  function openCart() {
    $("modal").hidden = true;
    $("drawer").hidden = false;
    $("scrim").hidden = false;
    $("cartBtn").setAttribute("aria-expanded", "true");
    renderCart();
  }

  function closeAll() {
    $("modal").hidden = true;
    $("drawer").hidden = true;
    $("scrim").hidden = true;
    state.modalId = null;
    $("cartBtn").setAttribute("aria-expanded", "false");
  }

  function updateHeaderCounts() {
    $("cartCount").textContent = state.cart.length;
    const ownedCount = state.owned.length;
    const libCountEl = $("libCount");
    if (libCountEl) {
      libCountEl.textContent = ownedCount ? ownedCount : "";
    }
  }

  /* 10. MODAL DE DETALHES DO JOGO ------------------------------------------- */

  function openModal(id) {
    const g = BY_ID[id];
    if (!g) return;
    state.modalId = id;

    const isOwned = has(state.owned, g.id);
    const inCart = has(state.cart, g.id);
    const isWish = has(state.wish, g.id);

    let buyHtml = "";
    if (isOwned) {
      buyHtml = '<button class="btn" disabled><i class="fa-solid fa-check"></i> Já na sua Biblioteca</button>';
    } else if (inCart) {
      buyHtml = '<button class="btn ghost" data-act="openCart"><i class="fa-solid fa-bag-shopping"></i> No Carrinho (Abrir)</button>';
    } else {
      buyHtml = '<button class="steam-buy-btn" data-act="buy" data-id="' + g.id + '" style="font-size: 15px; padding: 10px 20px;">' +
        '<i class="fa-solid fa-cart-shopping"></i> ' + (g.price === 0 ? "Obter Grátis" : "Comprar Agora") +
      '</button>';
    }

    const sheet = $("sheet");
    sheet.innerHTML = '<button class="icon-btn close" type="button" data-act="close" aria-label="Fechar detalhes">' +
        '<i class="fa-solid fa-xmark"></i>' +
      '</button>' +
      '<div class="cover"><img class="art-img" src="' + g.img + '" alt="' + g.title + '"></div>' +
      '<div class="sheet-body">' +
        '<div>' +
          '<h2 id="mTitle" style="color: #fff; margin-bottom: 6px;">' + g.title + '</h2>' +
          '<p class="meta" style="color: #66c0f4; font-weight: 600; margin-bottom: 12px;">' + g.genres.join(" · ") + ' • ' + g.year + '</p>' +
          '<p style="font-size: 16px; color: #e4edf4; font-weight: 500; margin-bottom: 14px;">' + g.short + '</p>' +
          '<p style="color: #b8b6b4; line-height: 1.6; margin-bottom: 18px;">' + g.desc + '</p>' +
          '<div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; margin-top: 14px;">' +
            '<strong style="color: #66c0f4; font-size: 13px; text-transform: uppercase; display: block; margin-bottom: 6px;">Requisitos do Sistema</strong>' +
            '<p style="margin: 0; font-size: 12px; color: #8f98a0; line-height: 1.5;">Windows 10/11 64-bit • Processador Intel Core i5 / AMD Ryzen 5 • 16 GB RAM • Placa de Vídeo compatível com DirectX 12 • Conexão banda larga.</p>' +
          '</div>' +
        '</div>' +
        '<dl class="specs">' +
          '<dt>Estúdio</dt><dd>' + g.dev + '</dd>' +
          '<dt>Lançamento</dt><dd>' + g.year + '</dd>' +
          '<dt>Avaliações Steam</dt><dd style="color: #66c0f4;">' + reviewLabel(g.rating) + '</dd>' +
          '<dt>Plataformas</dt><dd>' + g.platforms.join(", ") + '</dd>' +
          '<dt>Gêneros</dt><dd>' + g.genres.join(", ") + '</dd>' +
        '</dl>' +
        '<div class="buybox">' +
          priceBadge(g) +
          '<div class="row">' +
            '<button class="icon-btn" type="button" data-act="wish" data-id="' + g.id + '" style="' + (isWish ? 'color: var(--deal); border-color: var(--deal);' : '') + '" title="Desejar">' +
              '<i class="' + (isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart') + '"></i>' +
            '</button>' +
            buyHtml +
          '</div>' +
        '</div>' +
      '</div>';

    $("modal").hidden = false;
    $("scrim").hidden = false;
    const closeBtn = sheet.querySelector(".close");
    if (closeBtn) closeBtn.focus();
  }

  /* 11. ROTINA DE COMPRAS E EVENTOS ----------------------------------------- */

  function addToCart(id) {
    const g = BY_ID[id];
    if (!g) return;

    if (g.price === 0) {
      if (!has(state.owned, id)) {
        state.owned.push(id);
        toast("🎮 " + g.title + " foi adicionado à sua biblioteca gratuitamente!");
      } else {
        toast("Você já possui este jogo na sua biblioteca.");
      }
    } else {
      if (!has(state.cart, id)) {
        state.cart.push(id);
        toast("🛒 " + g.title + " foi adicionado ao carrinho!");
      } else {
        openCart();
      }
    }

    save();
    renderCatalog();
    renderSpotlight();
    renderCart();
  }

  function removeFromCart(id) {
    const i = state.cart.indexOf(id);
    if (i !== -1) {
      state.cart.splice(i, 1);
      save();
      renderCatalog();
      renderSpotlight();
      renderCart();
      toast("Item removido do carrinho.");
    }
  }

  function toggleWish(id) {
    const g = BY_ID[id];
    const i = state.wish.indexOf(id);
    let added = false;
    if (i === -1) {
      state.wish.push(id);
      added = true;
    } else {
      state.wish.splice(i, 1);
    }
    save();
    renderCatalog();
    if (state.modalId === id) openModal(id);
    toast(added ? "❤️ " + g.title + " adicionado aos Desejados." : "Removido da lista de desejos.");
  }

  function checkout() {
    const n = state.cart.length;
    if (!n) return;

    state.cart.forEach(function (id) {
      if (!has(state.owned, id)) state.owned.push(id);
      state.wish = state.wish.filter(function (w) { return w !== id; });
    });
    state.cart = [];
    save();
    renderCatalog();
    renderSpotlight();
    renderCart();
    closeAll();
    toast("🎉 Compra simulada concluída! " + n + (n === 1 ? " jogo adicionado" : " jogos adicionados") + " à sua biblioteca.");
  }

  /* 12. EVENT LISTENERS GLOBAIS --------------------------------------------- */

  document.addEventListener("click", function (e) {
    if (e.target === $("scrim") || e.target === $("modal")) {
      closeAll();
      return;
    }

    // Ações de botões
    const el = e.target.closest("[data-act]");
    if (el) {
      const act = el.getAttribute("data-act");
      const id = el.getAttribute("data-id");
      if (act === "modal") {
        openModal(id);
      } else if (act === "buy") {
        addToCart(id);
      } else if (act === "removeFromCart") {
        removeFromCart(id);
      } else if (act === "wish") {
        toggleWish(id);
      } else if (act === "openCart") {
        openCart();
      } else if (act === "close") {
        closeAll();
      }
      return;
    }

    // Miniatura do spotlight
    const thumbEl = e.target.closest("[data-spotlight-i]");
    if (thumbEl) {
      state.spotlightIndex = parseInt(thumbEl.getAttribute("data-spotlight-i"), 10);
      renderSpotlight();
      return;
    }

    // Filtros de gênero na sidebar
    const genreBtn = e.target.closest("[data-genre]");
    if (genreBtn) {
      state.genre = genreBtn.getAttribute("data-genre");
      document.querySelectorAll("#genreFilterList .steam-filter-item").forEach(function (b) {
        b.classList.toggle("active", b === genreBtn);
      });
      renderCatalog();
      return;
    }

    // Filtros de preço
    const priceBtn = e.target.closest("[data-price]");
    if (priceBtn) {
      state.price = priceBtn.getAttribute("data-price");
      document.querySelectorAll("#priceFilterList .steam-filter-item").forEach(function (b) {
        b.classList.toggle("active", b === priceBtn);
      });
      renderCatalog();
      return;
    }

    // Filtros de plataforma
    const platBtn = e.target.closest("[data-platform]");
    if (platBtn) {
      state.platform = platBtn.getAttribute("data-platform");
      document.querySelectorAll("#platformFilterList .steam-filter-item").forEach(function (b) {
        b.classList.toggle("active", b === platBtn);
      });
      renderCatalog();
      return;
    }

    // Abas Rápidas Steam
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) {
      state.tab = tabBtn.getAttribute("data-tab");
      document.querySelectorAll(".steam-tabs .steam-tab").forEach(function (b) {
        b.classList.toggle("active", b === tabBtn);
      });
      renderCatalog();
      return;
    }
  });

  // Spotlight controles diretos
  $("spotlightDetailsBtn").addEventListener("click", function () {
    const g = SPOTLIGHT_GAMES[state.spotlightIndex];
    if (g) openModal(g.id);
  });

  $("spotlightBuyBtn").addEventListener("click", function () {
    const g = SPOTLIGHT_GAMES[state.spotlightIndex];
    if (g) addToCart(g.id);
  });

  // Alternadores de Modo Lista e Grade
  $("btnViewList").addEventListener("click", function () {
    state.view = "list";
    store.set("steamView", "list");
    $("btnViewList").classList.add("active");
    $("btnViewList").setAttribute("aria-pressed", "true");
    $("btnViewGrid").classList.remove("active");
    $("btnViewGrid").setAttribute("aria-pressed", "false");
    renderCatalog();
  });

  $("btnViewGrid").addEventListener("click", function () {
    state.view = "grid";
    store.set("steamView", "grid");
    $("btnViewGrid").classList.add("active");
    $("btnViewGrid").setAttribute("aria-pressed", "true");
    $("btnViewList").classList.remove("active");
    $("btnViewList").setAttribute("aria-pressed", "false");
    renderCatalog();
  });

  // Busca e Ordenação
  $("steamSearch").addEventListener("input", function (e) {
    state.query = e.target.value.trim();
    renderCatalog();
  });

  $("steamSort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    renderCatalog();
  });

  // Limpar filtros
  $("resetGenreFilter").addEventListener("click", function () {
    state.genre = "todos";
    document.querySelectorAll("#genreFilterList .steam-filter-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-genre") === "todos");
    });
    renderCatalog();
  });

  $("clearAllFilters").addEventListener("click", function () {
    state.genre = "todos";
    state.price = "todos";
    state.platform = "todos";
    state.tab = "todos";
    state.query = "";
    $("steamSearch").value = "";
    initGenreFilters();
    document.querySelectorAll("#priceFilterList .steam-filter-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-price") === "todos");
    });
    document.querySelectorAll("#platformFilterList .steam-filter-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-platform") === "todos");
    });
    document.querySelectorAll(".steam-tabs .steam-tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === "todos");
    });
    renderCatalog();
    toast("Filtros restaurados.");
  });

  // Carrinho e Conta
  $("cartBtn").addEventListener("click", openCart);
  $("cartCloseBtn").addEventListener("click", closeAll);
  $("checkoutBtn").addEventListener("click", checkout);

  $("themeBtn").addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });

  $("accountBtn").addEventListener("click", openAccount);
  $("accountClose").addEventListener("click", closeAccount);
  $("accountModal").addEventListener("click", function (e) {
    if (e.target === $("accountModal")) closeAccount();
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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(); closeAccount(); }
  });

  /* 13. INICIALIZAÇÃO ------------------------------------------------------- */

  applyTheme(store.get("theme", "dark"));
  updateHeaderCounts();
  initGenreFilters();

  // Aplica preferência de visualização
  if (state.view === "grid") {
    $("btnViewGrid").classList.add("active");
    $("btnViewGrid").setAttribute("aria-pressed", "true");
    $("btnViewList").classList.remove("active");
    $("btnViewList").setAttribute("aria-pressed", "false");
  }

  renderSpotlight();
  renderCatalog();
  renderCart();

  // Rotação suave do spotlight a cada 7 segundos se o usuário não estiver interagindo
  let spotlightPaused = false;
  const spotlightSection = $("steamSpotlight");
  if (spotlightSection) {
    spotlightSection.addEventListener("mouseenter", function () { spotlightPaused = true; });
    spotlightSection.addEventListener("mouseleave", function () { spotlightPaused = false; });
  }

  setInterval(function () {
    if (spotlightPaused || !$("modal").hidden || !$("drawer").hidden) return;
    if (SPOTLIGHT_GAMES.length > 1) {
      state.spotlightIndex = (state.spotlightIndex + 1) % SPOTLIGHT_GAMES.length;
      renderSpotlight();
    }
  }, 7000);

})();
