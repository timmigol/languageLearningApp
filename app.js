// LingoRead Application Logic
// Handles ~200-word CEFR text generation (Spanish & Swedish), optional/random topics,
// word & sentence-fragment selection, translation + 1 example lookup, confirmation, and Vocabulary Inventory.

(function () {
  const STORAGE_KEY_VOCAB = "lingoread_vocab_inventory_v1";
  const STORAGE_KEY_API = "lingoread_api_settings_v1";

  // Application State
  const state = {
    language: "es", // 'es' | 'sv'
    level: "B1", // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    topic: "", // empty string = Random topic
    currentPassage: null, // { title, topic, language, level, sentences: [{target, en}] }
    pendingSelection: null, // { phrase, sentenceContext, sentenceEn, translation, exampleTarget, exampleEn }
    vocabInventory: [],
    vocabFilter: "all", // 'all' | 'es' | 'sv'
    vocabSearch: "",
    apiSettings: {
      provider: "gemini",
      apiKey: "",
      githubRepo: "timmigol/languageLearningApp",
      githubToken: ""
    }
  };

  // Word-level fallback mini-glossaries for common Spanish & Swedish words
  const WORD_GLOSSARY = {
    es: {
      todos: "all / every", días: "days", mañana: "morning / tomorrow", sol: "sun",
      ventana: "window", habitación: "bedroom / room", primero: "first", cocina: "kitchen",
      preparar: "to prepare", taza: "cup", grande: "large / big", café: "coffee",
      caliente: "hot / warm", leche: "milk", fresca: "fresh", pan: "bread",
      tostado: "toasted", aceite: "oil", oliva: "olive", tomate: "tomato",
      mientras: "while", música: "music", suave: "soft / gentle", gato: "cat",
      negro: "black", siempre: "always", duerme: "sleeps", silla: "chair",
      cerca: "near", mesa: "table", comida: "food / meal", después: "after / afterwards",
      dientes: "teeth", mochila: "backpack", azul: "blue", libros: "books",
      cuaderno: "notebook", calle: "street", estación: "station", autobuses: "buses",
      vecina: "neighbor", flores: "flowers", amarillas: "yellow", periódico: "newspaper",
      árboles: "trees", verdes: "green", parque: "park", escuela: "school",
      amigos: "friends", palabras: "words", frases: "sentences / phrases", tarde: "afternoon / evening",
      casa: "house / home", descansar: "to rest", cenar: "to have dinner", sopa: "soup",
      leer: "to read", libro: "book", mercado: "market", barrio: "neighborhood",
      hermano: "brother", comprar: "to buy", bolsas: "bags", frutas: "fruits",
      verduras: "vegetables", semana: "week", manzanas: "apples", naranjas: "oranges",
      dulces: "sweet", vendedor: "seller", amable: "kind / friendly", panadería: "bakery",
      queso: "cheese", agua: "water", ensalada: "salad", familia: "family",
      tren: "train", pueblo: "town / village", mar: "sea", playa: "beach",
      hotel: "hotel", maletas: "suitcases", olas: "waves", restaurante: "restaurant",
      puerto: "port / harbor", pescado: "fish", faro: "lighthouse", colina: "hill",
      paisaje: "landscape", cielo: "sky", atardecer: "sunset / dusk", verano: "summer",
      costumbre: "habit / custom", tiempo: "time / weather", teléfono: "phone", ojos: "eyes",
      rutina: "routine", cansancio: "tiredness", oficina: "office", hábitos: "habits",
      calma: "calm", silencio: "silence", brisa: "breeze", objetivos: "goals",
      jornada: "workday / day", ideas: "ideas", estrés: "stress", bienestar: "well-being",
      bosques: "forests", sierra: "mountain range", senderos: "trails", hojas: "leaves",
      montaña: "mountain", arroyos: "streams", setas: "mushrooms", calzado: "footwear",
      miradores: "viewpoints", valle: "valley", niebla: "fog", aves: "birds",
      chimenea: "fireplace", naturaleza: "nature", redes: "networks", entorno: "environment",
      ciudades: "cities", vivienda: "housing", teletrabajo: "remote work", desafíos: "challenges",
      equipos: "teams", horarios: "schedules", límites: "boundaries / limits", edificios: "buildings",
      economía: "economy", alquileres: "rents", innovación: "innovation", futuro: "future",
      arquitectura: "architecture", fachadas: "facades", plazas: "squares", callejuelas: "alleys",
      patrimonio: "heritage", biblioteca: "library", madera: "wood", memoria: "memory",
      silencio: "silence", atención: "attention", pensamiento: "thought", lectura: "reading",
      empatía: "empathy", curiosidad: "curiosity"
    },
    sv: {
      varje: "every", morgon: "morning", vaknar: "wake up", klockan: "o'clock / the clock",
      sju: "seven", solen: "the sun", skiner: "shines", genom: "through",
      fönster: "window", sovrummet: "the bedroom", sängen: "the bed", varm: "warm",
      tröja: "sweater", köket: "the kitchen", brygger: "brew", stor: "large / big",
      kopp: "cup", svart: "black", kaffe: "coffee", smörgåsar: "sandwiches",
      ost: "cheese", gurka: "cucumber", köksbordet: "the kitchen table", lyssna: "listen",
      nyheterna: "the news", medan: "while", äter: "eat", frukost: "breakfast",
      hund: "dog", stol: "chair", bruna: "brown", ögon: "eyes",
      borstar: "brush", tänderna: "the teeth", ryggsäck: "backpack", böcker: "books",
      gröna: "green", jacka: "jacket", gatan: "the street", promenad: "walk",
      parken: "the park", tunnelbanan: "the subway", centrum: "city center", språkskola: "language school",
      torget: "the square", lektionen: "the lesson / class", pratar: "speak / talk", svenska: "Swedish",
      vänner: "friends", läser: "read", enkla: "simple", texter: "texts",
      nya: "new", ord: "words", eftermiddagen: "the afternoon", cyklar: "cycle / bike",
      middag: "dinner", potatis: "potatoes", fisk: "fish", bok: "book",
      lördagar: "Saturdays", syster: "sister", handla: "shop", mat: "food",
      grönsaker: "vegetables", äpplen: "apples", jordgubbar: "strawberries", smör: "butter",
      lax: "salmon", bageri: "bakery", fika: "coffee break", kanelbulle: "cinnamon bun",
      mjölk: "milk", bröd: "bread", helgen: "the weekend", sommarresa: "summer trip",
      västkusten: "the west coast", tåg: "train", fiskeby: "fishing village", vädret: "the weather",
      soligt: "sunny", havet: "the sea", stuga: "cottage", klipporna: "the rocks",
      vattnet: "the water", segelbåtar: "sailboats", räkor: "shrimp", cyklar: "bicycles",
      sommarblommor: "summer flowers", horisonten: "the horizon", minnen: "memories",
      allemansrätten: "right of public access", naturen: "nature", skogar: "forests",
      sjöar: "lakes", bär: "berries", svamp: "mushrooms", hösten: "the autumn",
      löven: "the leaves", kantareller: "chanterelles", skogsstigar: "forest trails",
      vardagens: "everyday", skogssjö: "forest lake", tystnaden: "the silence",
      lagom: "just enough / balanced", balans: "balance", arbete: "work", återhämtning: "recovery",
      arbetsplatser: "workplaces", samarbete: "collaboration", fikapauser: "coffee breaks",
      kollegor: "colleagues", vintermånaderna: "the winter months", kläder: "clothes",
      livskvalitet: "quality of life", harmoni: "harmony", utveckling: "development",
      företag: "companies", hybridarbete: "hybrid work", kontoret: "the office",
      flexibilitet: "flexibility", livspusslet: "work-life balance", kommunikation: "communication",
      ledarskap: "leadership", förtroende: "trust", mötesplatser: "meeting places",
      energi: "energy", bostäder: "housing", kollektivtrafik: "public transport",
      hållbarhet: "sustainability", stadsplanering: "urban planning", arkitektur: "architecture",
      demokrati: "democracy", gemenskap: "community", grönska: "greenery", folkbibliotek: "public library",
      sammanhållningen: "the cohesion", invånare: "residents", eftertanke: "reflection",
      samhället: "society", insikt: "insight", läsning: "reading", språket: "the language",
      tystnad: "silence"
    }
  };

  // Topic-adaptive vocabulary bank for custom user topics in offline mode
  const TOPIC_ADAPTIVE_Templates = {
    es: {
      A1: (topic) => [
        {
          target: `Hoy quiero hablar sobre un tema muy interesante para mí: ${topic} en nuestra vida diaria.`,
          en: `Today I want to talk about a very interesting topic for me: ${topic} in our daily life.`
        },
        {
          target: `Todas las semanas leo libros sencillos y busco palabras nuevas relacionadas con ${topic} en mi cuaderno azul.`,
          en: `Every week I read simple books and look for new words related to ${topic} in my blue notebook.`
        }
      ],
      A2: (topic) => [
        {
          target: `Últimamente he descubierto muchas cosas curiosas sobre ${topic} gracias a las conversaciones con mis amigos.`,
          en: `Lately I have discovered many curious things about ${topic} thanks to conversations with my friends.`
        },
        {
          target: `Cuando tenemos tiempo libre durante el fin de semana, nos gusta compartir ideas prácticas sobre ${topic}.`,
          en: `When we have free time during the weekend, we like to share practical ideas about ${topic}.`
        }
      ],
      B1: (topic) => [
        {
          target: `En la actualidad, reflexionar sobre ${topic} nos permite comprender mejor cómo cambian nuestras costumbres cotidianas.`,
          en: `Nowadays, reflecting on ${topic} allows us to better understand how our everyday habits are changing.`
        },
        {
          target: `Dedicar tiempo cada semana a aprender más acerca de ${topic} resulta una experiencia enriquecedora y muy útil.`,
          en: `Dedicating time each week to learning more about ${topic} is an enriching and very useful experience.`
        }
      ],
      B2: (topic) => [
        {
          target: `El interés creciente por ${topic} refleja una transformación profunda en las prioridades de la sociedad contemporánea.`,
          en: `The growing interest in ${topic} reflects a profound transformation in the priorities of contemporary society.`
        },
        {
          target: `Analizar las distintas perspectivas en torno a ${topic} exige combinar la curiosidad práctica con el pensamiento crítico.`,
          en: `Analyzing the different perspectives around ${topic} requires combining practical curiosity with critical thinking.`
        }
      ],
      C1: (topic) => [
        {
          target: `Abordar la complejidad inherente a ${topic} supone examinar tanto sus implicaciones culturales como su impacto a largo plazo.`,
          en: `Addressing the complexity inherent in ${topic} entails examining both its cultural implications and its long-term impact.`
        },
        {
          target: `El debate contemporáneo en torno a ${topic} pone de manifiesto la necesidad de articular soluciones equilibradas y rigurosas.`,
          en: `Contemporary debate surrounding ${topic} highlights the need to articulate balanced and rigorous solutions.`
        }
      ],
      C2: (topic) => [
        {
          target: `Cualquier aproximación rigurosa al fenómeno de ${topic} requiere desentrañar los matices conceptuales que subyacen a nuestra época.`,
          en: `Any rigorous approach to the phenomenon of ${topic} requires unraveling the conceptual nuances that underlie our era.`
        },
        {
          target: `Así pues, la reflexión pausada sobre ${topic} se erige en un ejercicio indispensable de lucidez intelectual y diálogo ciudadano.`,
          en: `Thus, unhurried reflection on ${topic} stands as an indispensable exercise of intellectual lucidity and civic dialogue.`
        }
      ]
    },
    sv: {
      A1: (topic) => [
        {
          target: `Idag vill jag berätta om ett mycket intressant ämne i min vardag: ${topic}.`,
          en: `Today I want to tell you about a very interesting topic in my everyday life: ${topic}.`
        },
        {
          target: `Varje vecka läser jag enkla texter och skriver nya ord om ${topic} i min anteckningsbok.`,
          en: `Every week I read simple texts and write new words about ${topic} in my notebook.`
        }
      ],
      A2: (topic) => [
        {
          target: `På sista tiden har jag lärt mig mycket nytt om ${topic} genom att prata med mina vänner.`,
          en: `Lately I have learned a lot of new things about ${topic} by talking with my friends.`
        },
        {
          target: `När vi har ledig tid under helgen tycker vi om att diskutera idéer kring ${topic}.`,
          en: `When we have free time during the weekend we like to discuss ideas around ${topic}.`
        }
      ],
      B1: (topic) => [
        {
          target: `Att fundera närmare på ${topic} hjälper oss att förstå hur våra vanor utvecklas i vardagen.`,
          en: `Thinking more closely about ${topic} helps us understand how our habits develop in everyday life.`
        },
        {
          target: `När man avsätter tid för att utforska ${topic} upptäcker man ofta nya och inspirerande perspektiv.`,
          en: `When you set aside time to explore ${topic}, you often discover new and inspiring perspectives.`
        }
      ],
      B2: (topic) => [
        {
          target: `Det växande intresset för ${topic} speglar hur människor idag söker hållbara lösningar och ny kunskap.`,
          en: `The growing interest in ${topic} reflects how people today seek sustainable solutions and new knowledge.`
        },
        {
          target: `Genom att belysa ${topic} ur flera synvinklar kan vi fatta mer genomtänkta beslut i framtiden.`,
          en: `By illuminating ${topic} from several angles, we can make more well-considered decisions in the future.`
        }
      ],
      C1: (topic) => [
        {
          target: `En fördjupad diskussion kring ${topic} förutsätter att vi väger samman historiska erfarenheter med nutida behov.`,
          en: `An in-depth discussion around ${topic} presupposes that we weigh historical experiences together with contemporary needs.`
        },
        {
          target: `Hur vi väljer att förhålla oss till ${topic} får därmed stor betydelse för samhällets långsiktiga utveckling.`,
          en: `How we choose to relate to ${topic} thus gains great significance for society's long-term development.`
        }
      ],
      C2: (topic) => [
        {
          target: `Varje nyanserad betraktelse över ${topic} kräver att vi dröjer vid de subtila samband som präglar vår samtid.`,
          en: `Every nuanced reflection on ${topic} requires that we linger over the subtle connections that characterize our time.`
        },
        {
          target: `Således utgör ett reflekterande samtal om ${topic} en värdefull grund för såväl insikt som omdömesförmåga.`,
          en: `Thus, a reflective conversation about ${topic} constitutes a valuable foundation for both insight and judgment.`
        }
      ]
    }
  };

  // DOM References
  const dom = {
    langBtns: document.querySelectorAll(".segment-btn[data-lang]"),
    levelBtns: document.querySelectorAll(".level-pill[data-level]"),
    topicInput: document.getElementById("topicInput"),
    clearTopicBtn: document.getElementById("clearTopicBtn"),
    topicChips: document.querySelectorAll(".topic-chip"),
    generateBtn: document.getElementById("generateBtn"),
    activeLangBadge: document.getElementById("activeLangBadge"),
    activeLevelBadge: document.getElementById("activeLevelBadge"),
    activeTopicBadge: document.getElementById("activeTopicBadge"),
    wordCountDisplay: document.getElementById("wordCountDisplay"),
    passageTitle: document.getElementById("passageTitle"),
    passageContainer: document.getElementById("passageContainer"),
    toggleParallelBtn: document.getElementById("toggleParallelBtn"),
    parallelTranslationBox: document.getElementById("parallelTranslationBox"),
    parallelTranslationText: document.getElementById("parallelTranslationText"),
    speakTextBtn: document.getElementById("speakTextBtn"),

    // Selection Confirm Card
    selectionConfirmCard: document.getElementById("selectionConfirmCard"),
    cancelSelectionBtn: document.getElementById("cancelSelectionBtn"),
    selectedLangTag: document.getElementById("selectedLangTag"),
    speakSelectionBtn: document.getElementById("speakSelectionBtn"),
    selectedPhraseDisplay: document.getElementById("selectedPhraseDisplay"),
    selectionLoadingState: document.getElementById("selectionLoadingState"),
    selectionFormFields: document.getElementById("selectionFormFields"),
    confirmTranslationInput: document.getElementById("confirmTranslationInput"),
    exampleLangLabel: document.getElementById("exampleLangLabel"),
    confirmExampleTargetInput: document.getElementById("confirmExampleTargetInput"),
    confirmExampleEnglishInput: document.getElementById("confirmExampleEnglishInput"),
    confirmSaveVocabBtn: document.getElementById("confirmSaveVocabBtn"),

    // Floating Popover
    floatingPopover: document.getElementById("floatingSelectionPopover"),
    popoverTerm: document.getElementById("popoverTerm"),
    popoverTrans: document.getElementById("popoverTrans"),
    popoverExample: document.getElementById("popoverExample"),
    popoverQuickConfirmBtn: document.getElementById("popoverQuickConfirmBtn"),
    popoverEditBtn: document.getElementById("popoverEditBtn"),

    // Inventory
    inventoryCountBadge: document.getElementById("inventoryCountBadge"),
    syncStatusText: document.getElementById("syncStatusText"),
    filterTabs: document.querySelectorAll(".filter-tab"),
    vocabSearchInput: document.getElementById("vocabSearchInput"),
    saveJsonBtn: document.getElementById("saveJsonBtn"),
    loadJsonInput: document.getElementById("loadJsonInput"),
    exportVocabBtn: document.getElementById("exportVocabBtn"),
    inventoryList: document.getElementById("inventoryList"),

    // Settings Modal
    modeBadgeBtn: document.getElementById("modeBadgeBtn"),
    modeBadgeText: document.getElementById("modeBadgeText"),
    settingsBtn: document.getElementById("settingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
    closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
    githubRepoInput: document.getElementById("githubRepoInput"),
    githubTokenInput: document.getElementById("githubTokenInput"),
    apiProviderSelect: document.getElementById("apiProviderSelect"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
    clearApiKeyBtn: document.getElementById("clearApiKeyBtn")
  };

  // Initialization
  async function init() {
    await loadSavedState();
    bindEvents();
    updateModeBadge();
    renderInventory();
    generatePassage();
  }

  async function loadSavedState() {
    try {
      const savedVocab = localStorage.getItem(STORAGE_KEY_VOCAB);
      if (savedVocab) {
        state.vocabInventory = JSON.parse(savedVocab);
      }
      const savedApi = localStorage.getItem(STORAGE_KEY_API);
      if (savedApi) {
        state.apiSettings = JSON.parse(savedApi);
      }
    } catch (e) {
      console.warn("Could not read localStorage:", e);
    }

    // Also load vocabulary.json from the repo/folder and merge any missing items
    try {
      const res = await fetch("vocabulary.json", { cache: "no-store" });
      if (res.ok) {
        const fileItems = await res.json();
        if (Array.isArray(fileItems)) {
          mergeVocabularyItems(fileItems);
        }
      }
    } catch (err) {
      // Runs fine even if opened via file:// where fetch may be restricted
    }
  }

  function mergeVocabularyItems(incomingItems) {
    let added = false;
    incomingItems.forEach((item) => {
      if (!item || !item.term || !item.language) return;
      const exists = state.vocabInventory.some(
        (existing) =>
          existing.language === item.language &&
          existing.term.toLowerCase() === item.term.toLowerCase()
      );
      if (!exists) {
        state.vocabInventory.push({
          id: item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          term: item.term,
          language: item.language,
          level: item.level || "B1",
          translation: item.translation || "",
          exampleTarget: item.exampleTarget || "",
          exampleEn: item.exampleEn || "",
          createdAt: item.createdAt || new Date().toISOString()
        });
        added = true;
      }
    });
    if (added) {
      saveVocabToStorage();
    }
  }

  function saveVocabToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(state.vocabInventory));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  // Push updated vocabulary.json directly to GitHub repository via GitHub Contents API
  async function syncVocabToGitHub(commitMsg) {
    const token = state.apiSettings?.githubToken?.trim();
    const repo = (state.apiSettings?.githubRepo || "timmigol/languageLearningApp").trim();
    if (!token || !repo) return;

    if (dom.syncStatusText) {
      dom.syncStatusText.textContent = "⏳ Syncing vocabulary.json to GitHub...";
    }

    try {
      const apiUrl = `https://api.github.com/repos/${repo}/contents/vocabulary.json`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      };

      // 1. Get current file SHA if vocabulary.json already exists
      let sha = undefined;
      const getRes = await fetch(apiUrl, { headers, cache: "no-store" });
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Encode UTF-8 JSON to Base64
      const jsonStr = JSON.stringify(state.vocabInventory, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));

      // 3. Commit updated vocabulary.json
      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: commitMsg || "Update vocabulary.json from LingoRead app",
          content: base64Content,
          ...(sha ? { sha } : {})
        })
      });

      if (!putRes.ok) {
        throw new Error(`GitHub API ${putRes.status}`);
      }

      if (dom.syncStatusText) {
        dom.syncStatusText.textContent = "✅ Auto-saved to GitHub (vocabulary.json)";
      }
    } catch (err) {
      console.warn("GitHub auto-sync failed:", err);
      if (dom.syncStatusText) {
        dom.syncStatusText.textContent = "⚠️ Saved locally (GitHub sync failed — check token permissions)";
      }
    }
  }

  function updateModeBadge() {
    const hasAi = Boolean(state.apiSettings && state.apiSettings.apiKey);
    const hasGh = Boolean(state.apiSettings && state.apiSettings.githubToken);

    if (hasAi && hasGh) {
      const providerName = state.apiSettings.provider === "openai" ? "OpenAI" : "Gemini";
      dom.modeBadgeText.textContent = `${providerName} + GitHub Auto-Sync`;
    } else if (hasGh) {
      dom.modeBadgeText.textContent = "GitHub Auto-Sync Active";
    } else if (hasAi) {
      const providerName = state.apiSettings.provider === "openai" ? "OpenAI Live AI" : "Gemini Live AI";
      dom.modeBadgeText.textContent = `${providerName} + Offline Fallback`;
    } else {
      dom.modeBadgeText.textContent = "Built-in Engine + Dictionary";
    }

    if (dom.syncStatusText) {
      dom.syncStatusText.textContent = hasGh
        ? `✅ Connected to ${state.apiSettings.githubRepo || "timmigol/languageLearningApp"} (auto-saves vocabulary.json)`
        : "Saved in browser · Click Sync & AI Settings for auto-GitHub save";
    }
  }

  // Word counting utility
  function countWords(text) {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  // Normalize text to ~200 words (target 190 - 210 words)
  function calibrateTo200Words(sentences, lang, level, topicLabel) {
    const cloned = sentences.map((s) => ({ ...s }));

    // Additional level-appropriate sentences to reach ~200 words smoothly
    const expansionSentences = {
      es: {
        A1: [
          {
            target: "Para mí es muy importante practicar un poco cada día porque así aprendo palabras nuevas con facilidad.",
            en: "For me it is very important to practice a little every day because that way I learn new words easily."
          },
          {
            target: "Además, me gusta compartir estas pequeñas historias con mis amigos cuando nos vemos por la tarde.",
            en: "In addition, I like sharing these little stories with my friends when we meet in the afternoon."
          },
          {
            target: "Al final del día siempre escribo tres frases sencillas en mi diario personal antes de apagar la luz.",
            en: "At the end of the day I always write three simple sentences in my personal diary before turning off the light."
          }
        ],
        A2: [
          {
            target: "Siempre que tengo la oportunidad, intento anotar los detalles más curiosos para recordarlos mejor en el futuro.",
            en: "Whenever I have the opportunity, I try to write down the most curious details to remember them better in the future."
          },
          {
            target: "Hablar de estas experiencias con otras personas ayuda a descubrir puntos de vista diferentes y enriquecedores.",
            en: "Talking about these experiences with other people helps discover different and enriching points of view."
          },
          {
            target: "Con el paso de las semanas uno nota cómo mejora la comprensión y crece la confianza al expresarse.",
            en: "As the weeks go by, one notices how comprehension improves and confidence grows when expressing oneself."
          }
        ],
        B1: [
          {
            target: "A menudo pasamos por alto estos pequeños detalles cotidianos, aunque son precisamente los que aportan equilibrio a nuestra semana.",
            en: "We often overlook these small everyday details, although they are precisely what bring balance to our week."
          },
          {
            target: "Por esa razón merece la pena detenerse unos minutos a observar el entorno con atención y curiosidad renovada.",
            en: "For that reason it is worthwhile to pause for a few minutes to observe the surroundings with attention and renewed curiosity."
          }
        ],
        B2: [
          {
            target: "Este conjunto de factores demuestra hasta qué punto nuestras decisiones individuales están conectadas con las dinámicas colectivas de nuestra época.",
            en: "This set of factors demonstrates the extent to which our individual decisions are connected with the collective dynamics of our time."
          },
          {
            target: "Adoptar una mirada reflexiva nos permite anticipar los cambios y adaptarnos con mayor serenidad a los nuevos escenarios.",
            en: "Adopting a reflective outlook allows us to anticipate changes and adapt with greater serenity to new scenarios."
          }
        ],
        C1: [
          {
            target: "Resulta, por tanto, ineludible fomentar espacios de encuentro donde la reflexión compartida prevalezca sobre la inercia superficial.",
            en: "It is, therefore, inescapable to foster spaces of encounter where shared reflection prevails over superficial inertia."
          },
          {
            target: "En esa convergencia entre sensibilidad histórica y visión de futuro reside la verdadera riqueza de nuestra vida cultural.",
            en: "In that convergence between historical sensitivity and vision for the future lies the true richness of our cultural life."
          }
        ],
        C2: [
          {
            target: "Solo quien se atreve a habitar esa fecunda lentitud logra desentrañar la urdimbre sutil que vincula la palabra con la experiencia humana.",
            en: "Only those who dare to inhabit that fertile slowness manage to unravel the subtle warp that links the word with human experience."
          },
          {
            target: "De ahí que preservar el sosiego intelectual constituya hoy una tarea tan apremiante como irrenunciable para la ciudadanía.",
            en: "Hence preserving intellectual tranquility today constitutes a task as pressing as it is indispensable for citizenry."
          }
        ]
      },
      sv: {
        A1: [
          {
            target: "Det är väldigt roligt att öva svenska varje dag eftersom jag förstår mer och mer för varje vecka.",
            en: "It is very fun to practice Swedish every day because I understand more and more each week."
          },
          {
            target: "Jag brukar också skriva ner nya meningar i ett litet häfte som jag alltid har i min väska.",
            en: "I also usually write down new sentences in a small booklet that I always keep in my bag."
          },
          {
            target: "När kvällen kommer känner jag mig nöjd och ser fram emot en ny och trevlig dag imorgon.",
            en: "When evening comes I feel satisfied and look forward to a new and pleasant day tomorrow."
          }
        ],
        A2: [
          {
            target: "När man tar sig tid att uppleva sådana stunder i lugn och ro blir vardagen mycket mer minnesvärd.",
            en: "When you take the time to experience such moments in peace and quiet, everyday life becomes much more memorable."
          },
          {
            target: "Jag berättar ofta om mina upplevelser för mina vänner så att vi kan planera nya utflykter tillsammans.",
            en: "I often tell my friends about my experiences so that we can plan new excursions together."
          },
          {
            target: "Det är just de här enkla vanorna som ger ny energi och glädje under hela året.",
            en: "It is precisely these simple habits that give new energy and joy throughout the whole year."
          }
        ],
        B1: [
          {
            target: "När vi stannar upp en stund i vardagen märker vi hur mycket dessa små detaljer faktiskt betyder för vårt välmående.",
            en: "When we pause for a moment in everyday life, we notice how much these small details actually mean for our well-being."
          },
          {
            target: "Att dela sådana erfarenheter med andra skapar både gemenskap och nya insikter som berikar livet.",
            en: "Sharing such experiences with others creates both community and new insights that enrich life."
          }
        ],
        B2: [
          {
            target: "Dessa samband visar tydligt hur våra dagliga val hänger samman med de bredare förändringarna i det moderna samhället.",
            en: "These connections clearly show how our daily choices are linked to the broader changes in modern society."
          },
          {
            target: "Genom att förena nyfikenhet med långsiktigt ansvarstagande står vi betydligt bättre rustade inför framtidens utmaningar.",
            en: "By combining curiosity with long-term responsibility, we are significantly better equipped for the challenges of the future."
          }
        ],
        C1: [
          {
            target: "I detta samspel mellan tradition och förnyelse framträder betydelsen av ett levande och inkluderande offentligt samtal.",
            en: "In this interplay between tradition and renewal, the importance of a vibrant and inclusive public conversation emerges."
          },
          {
            target: "Att värna dessa kvaliteter är därför en uppgift som angår varje engagerad medborgare i vår tid.",
            en: "Safeguarding these qualities is therefore a task that concerns every engaged citizen in our time."
          }
        ],
        C2: [
          {
            target: "Endast genom att bejaka denna intellektuella varsamhet förmår vi urskilja de djupare strömningar som formar vår kultur.",
            en: "Only by embracing this intellectual care are we able to discern the deeper currents that shape our culture."
          },
          {
            target: "Därmed framstår förmågan till eftertänksam närvaro som en av vår tids mest betydelsefulla mänskliga tillgångar.",
            en: "Thus, the capacity for reflective presence emerges as one of the most significant human assets of our time."
          }
        ]
      }
    };

    const extras = (expansionSentences[lang] && expansionSentences[lang][level]) || [];
    let idx = 0;

    while (
      countWords(cloned.map((s) => s.target).join(" ")) < 192 &&
      idx < extras.length
    ) {
      cloned.push(extras[idx]);
      idx++;
    }

    return cloned;
  }

  // Generate ~200-word passage (Built-in offline engine or live AI API if configured)
  async function generatePassage() {
    const lang = state.language;
    const level = state.level;
    const rawTopic = dom.topicInput.value.trim();
    state.topic = rawTopic;

    const originalBtnHTML = dom.generateBtn.innerHTML;
    dom.generateBtn.disabled = true;
    dom.generateBtn.innerHTML = `<div class="spinner-sm"></div><span>Generating ~200-Word ${level} Text...</span>`;

    closeSelectionInspector();

    try {
      // If user configured an AI API key, try live generation first
      if (state.apiSettings && state.apiSettings.apiKey) {
        const aiPassage = await generatePassageWithAI(lang, level, rawTopic);
        if (aiPassage) {
          state.currentPassage = aiPassage;
          renderPassage(aiPassage);
          return;
        }
      }

      // Built-in Offline CEFR Generator
      const offlinePassage = buildOfflinePassage(lang, level, rawTopic);
      state.currentPassage = offlinePassage;
      renderPassage(offlinePassage);
    } finally {
      dom.generateBtn.disabled = false;
      dom.generateBtn.innerHTML = originalBtnHTML;
    }
  }

  function buildOfflinePassage(lang, level, customTopic) {
    const langPassages = window.LINGO_DATA.passages[lang] || {};
    const levelList = langPassages[level] || langPassages["B1"];

    // Collect all passages across levels if we need topic matching
    let chosenTemplate = null;
    let displayTopic = customTopic || "Random";

    if (!customTopic) {
      // Pick random passage from this level
      const randomIndex = Math.floor(Math.random() * levelList.length);
      chosenTemplate = levelList[randomIndex];
      displayTopic = `${chosenTemplate.topic} (Random)`;
    } else {
      // Check if customTopic matches one of the preset topics in this level
      const normalizedQuery = customTopic.toLowerCase();
      chosenTemplate = levelList.find((p) =>
        p.topic.toLowerCase().includes(normalizedQuery) ||
        p.title.toLowerCase().includes(normalizedQuery)
      );

      if (!chosenTemplate) {
        // Adapt a level template with custom topic framing sentences so any topic works in offline mode
        const base = levelList[Math.floor(Math.random() * levelList.length)];
        const topicAdapters =
          TOPIC_ADAPTIVE_Templates[lang] &&
          TOPIC_ADAPTIVE_Templates[lang][level]
            ? TOPIC_ADAPTIVE_Templates[lang][level](customTopic)
            : [];

        const combinedSentences = [
          topicAdapters[0] || base.sentences[0],
          ...base.sentences.slice(1, 9),
          topicAdapters[1] || base.sentences[base.sentences.length - 1]
        ];

        const calibrated = calibrateTo200Words(combinedSentences, lang, level, customTopic);
        const titlePrefix = lang === "es" ? "Reflexiones sobre" : "Tankar om";
        return {
          title: `${titlePrefix} ${customTopic}`,
          topic: customTopic,
          language: lang,
          level: level,
          sentences: calibrated
        };
      }
    }

    const calibratedSentences = calibrateTo200Words(
      chosenTemplate.sentences,
      lang,
      level,
      displayTopic
    );

    return {
      title: chosenTemplate.title,
      topic: displayTopic,
      language: lang,
      level: level,
      sentences: calibratedSentences
    };
  }

  // Optional Live AI Generation (Gemini or OpenAI)
  async function generatePassageWithAI(lang, level, customTopic) {
    const langName = lang === "es" ? "Spanish (Español)" : "Swedish (Svenska)";
    const selectedTopic =
      customTopic ||
      window.LINGO_DATA.topics[Math.floor(Math.random() * window.LINGO_DATA.topics.length)];

    const prompt = `Write a reading passage in ${langName} at CEFR proficiency level ${level} about the topic: "${selectedTopic}".
Strict requirements:
- Length: approximately 200 words (between 185 and 215 words).
- Match vocabulary and grammar strictly to CEFR level ${level}.
- Return valid JSON only with this exact shape:
{
  "title": "Title in ${langName}",
  "topic": "${selectedTopic}",
  "sentences": [
    { "target": "Sentence 1 in ${langName}.", "en": "English translation of sentence 1." }
  ]
}`;

    try {
      if (state.apiSettings.provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.apiSettings.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (!res.ok) throw new Error("OpenAI request failed");
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          title: parsed.title,
          topic: customTopic ? parsed.topic : `${parsed.topic} (Random)`,
          language: lang,
          level: level,
          sentences: parsed.sentences
        };
      } else {
        // Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          state.apiSettings.apiKey
        )}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        if (!res.ok) throw new Error("Gemini request failed");
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawText);
        return {
          title: parsed.title,
          topic: customTopic ? parsed.topic : `${parsed.topic} (Random)`,
          language: lang,
          level: level,
          sentences: parsed.sentences
        };
      }
    } catch (err) {
      console.warn("Live AI generation fell back to built-in offline engine:", err);
      return null;
    }
  }

  // Render the passage into interactive sentences and clickable words
  function renderPassage(passage) {
    const langLabel = passage.language === "es" ? "🇪🇸 Spanish" : "🇸🇪 Swedish";
    dom.activeLangBadge.textContent = langLabel;
    dom.activeLevelBadge.textContent = `Level ${passage.level}`;
    dom.activeTopicBadge.textContent = `Topic: ${passage.topic}`;
    dom.passageTitle.textContent = passage.title;

    const fullTargetText = passage.sentences.map((s) => s.target).join(" ");
    const totalWords = countWords(fullTargetText);
    dom.wordCountDisplay.textContent = `${totalWords} words`;

    // Render into 2 readable paragraphs
    const mid = Math.ceil(passage.sentences.length / 2);
    const paragraphs = [
      passage.sentences.slice(0, mid),
      passage.sentences.slice(mid)
    ];

    const savedSet = new Set(
      state.vocabInventory
        .filter((item) => item.language === passage.language)
        .map((item) => item.term.toLowerCase())
    );

    dom.passageContainer.innerHTML = "";
    paragraphs.forEach((paraSentences, pIdx) => {
      const pEl = document.createElement("p");
      paraSentences.forEach((sentObj, sIdx) => {
        const globalSentIdx = pIdx === 0 ? sIdx : mid + sIdx;
        const sentSpan = document.createElement("span");
        sentSpan.className = "passage-sentence";
        sentSpan.dataset.sentIndex = globalSentIdx;

        // Tokenize words while preserving punctuation
        const tokens = sentObj.target.split(/(\s+)/);
        tokens.forEach((token) => {
          if (/^\s+$/.test(token)) {
            sentSpan.appendChild(document.createTextNode(token));
          } else {
            const match = token.match(/^([¡¿"«(]*)([^\s¡¿"».,;:!?()]+)([.,;:!?"»)]*)$/);
            if (match) {
              const [, prefix, coreWord, suffix] = match;
              if (prefix) sentSpan.appendChild(document.createTextNode(prefix));

              const wordSpan = document.createElement("span");
              wordSpan.className = "passage-word";
              if (savedSet.has(coreWord.toLowerCase())) {
                wordSpan.classList.add("saved-highlight");
              }
              wordSpan.textContent = coreWord;
              wordSpan.dataset.word = coreWord;
              wordSpan.dataset.sentIndex = globalSentIdx;
              sentSpan.appendChild(wordSpan);

              if (suffix) sentSpan.appendChild(document.createTextNode(suffix));
            } else {
              sentSpan.appendChild(document.createTextNode(token));
            }
          }
        });

        sentSpan.appendChild(document.createTextNode(" "));
        pEl.appendChild(sentSpan);
      });
      dom.passageContainer.appendChild(pEl);
    });

    // Update English Reference Translation
    dom.parallelTranslationText.textContent = passage.sentences
      .map((s) => s.en)
      .join(" ");
  }

  // Lookup or synthesize English translation + 1 example sentence for any selected word or part of sentence
  async function lookupSelectionDetails(selectedText, sentenceIdx) {
    const cleanPhrase = selectedText
      .replace(/^[.,;:!?¡¿"«()]+|[.,;:!?¡¿"»()]+$/g, "")
      .trim();

    if (!cleanPhrase) return null;

    const lang = state.language;
    const level = state.level;
    const lower = cleanPhrase.toLowerCase();

    const passageSentence =
      state.currentPassage &&
      state.currentPassage.sentences[sentenceIdx]
        ? state.currentPassage.sentences[sentenceIdx]
        : state.currentPassage?.sentences[0] || { target: "", en: "" };

    // 1. Check if exact phrase or word exists in LINGO_DATA.dictionary
    const langDict = window.LINGO_DATA.dictionary[lang] || {};
    if (langDict[lower]) {
      return {
        phrase: cleanPhrase,
        translation: langDict[lower].en,
        exampleTarget: langDict[lower].exampleTarget,
        exampleEn: langDict[lower].exampleEn
      };
    }

    // 2. If user configured Live AI API Key, fetch exact translation & 1 example sentence
    if (state.apiSettings && state.apiSettings.apiKey) {
      const aiResult = await lookupWithAI(cleanPhrase, passageSentence.target, lang, level);
      if (aiResult) return aiResult;
    }

    // 3. Offline Intelligent Phrase & Word Analyzer
    const words = lower.split(/\s+/);
    const wordGlossary = WORD_GLOSSARY[lang] || {};

    if (words.length === 1) {
      // Single word lookup
      let meaning = wordGlossary[lower];
      if (!meaning) {
        // Try stem matching
        const stemKey = Object.keys(wordGlossary).find(
          (k) => k.length > 4 && (lower.startsWith(k.slice(0, -1)) || k.startsWith(lower.slice(0, -1)))
        );
        if (stemKey) meaning = wordGlossary[stemKey];
      }

      if (!meaning && passageSentence.en) {
        meaning = inferWordFromAlignedSentence(lower, passageSentence.target, passageSentence.en);
      }

      return {
        phrase: cleanPhrase,
        translation: meaning || `(${lang.toUpperCase()}) "${cleanPhrase}"`,
        exampleTarget: passageSentence.target || buildFallbackExample(cleanPhrase, lang).target,
        exampleEn: passageSentence.en || buildFallbackExample(cleanPhrase, lang).en
      };
    } else {
      // Multi-word selection (part of a sentence)
      const fragmentTranslation = translateSentenceFragmentOffline(
        cleanPhrase,
        passageSentence.target,
        passageSentence.en,
        lang
      );

      return {
        phrase: cleanPhrase,
        translation: fragmentTranslation,
        exampleTarget: passageSentence.target || buildFallbackExample(cleanPhrase, lang).target,
        exampleEn: passageSentence.en || buildFallbackExample(cleanPhrase, lang).en
      };
    }
  }

  // Aligns a selected part of a sentence to its English counterpart using glossary + relative position
  function translateSentenceFragmentOffline(fragment, fullTarget, fullEn, lang) {
    if (!fullTarget || !fullEn) return fragment;

    const cleanTarget = fullTarget.toLowerCase();
    const cleanFrag = fragment.toLowerCase();

    // If the user selected almost the entire sentence, return full English sentence
    if (cleanFrag.length >= cleanTarget.length * 0.78) {
      return fullEn;
    }

    // Check if dictionary phrase is contained
    const langDict = window.LINGO_DATA.dictionary[lang] || {};
    const wordGlossary = WORD_GLOSSARY[lang] || {};
    const tokens = cleanFrag
      .replace(/[.,;:!?()]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    // Try word-by-word gloss if most tokens are known
    const glossedTokens = tokens
      .map((t) => langDict[t]?.en || wordGlossary[t] || null)
      .filter(Boolean);

    // Also compute proportional slice of the aligned English sentence
    const startRatio = Math.max(0, cleanTarget.indexOf(cleanFrag)) / Math.max(1, cleanTarget.length);
    const endRatio = Math.min(1, (cleanTarget.indexOf(cleanFrag) + cleanFrag.length) / Math.max(1, cleanTarget.length));

    const enWords = fullEn.split(/\s+/);
    const startIdx = Math.max(0, Math.floor(startRatio * enWords.length));
    const endIdx = Math.min(enWords.length, Math.ceil(endRatio * enWords.length) + 1);
    const proportionalSlice = enWords
      .slice(startIdx, endIdx)
      .join(" ")
      .replace(/^[.,;:!?]+|[.,;:!?]+$/g, "");

    if (proportionalSlice) {
      return proportionalSlice;
    }

    if (glossedTokens.length > 0) {
      return glossedTokens.join(" · ");
    }

    return fullEn;
  }

  function inferWordFromAlignedSentence(word, fullTarget, fullEn) {
    const targetWords = fullTarget
      .toLowerCase()
      .replace(/[.,;:!?]/g, "")
      .split(/\s+/);
    const enWords = fullEn
      .replace(/[.,;:!?]/g, "")
      .split(/\s+/);

    const idx = targetWords.indexOf(word);
    if (idx !== -1 && enWords.length > 0) {
      const approxIdx = Math.min(
        enWords.length - 1,
        Math.round((idx / Math.max(1, targetWords.length - 1)) * (enWords.length - 1))
      );
      const windowWords = enWords.slice(Math.max(0, approxIdx - 1), Math.min(enWords.length, approxIdx + 2));
      return windowWords.join(" ");
    }
    return "";
  }

  function buildFallbackExample(phrase, lang) {
    if (lang === "es") {
      return {
        target: `Es muy útil recordar la expresión «${phrase}» cuando conversamos en español.`,
        en: `It is very useful to remember the expression "${phrase}" when we converse in Spanish.`
      };
    }
    return {
      target: `Det är mycket användbart att komma ihåg uttrycket "${phrase}" när vi pratar svenska.`,
      en: `It is very useful to remember the expression "${phrase}" when we speak Swedish.`
    };
  }

  async function lookupWithAI(phrase, contextSentence, lang, level) {
    const langName = lang === "es" ? "Spanish" : "Swedish";
    const prompt = `For the ${langName} word or sentence fragment "${phrase}" (appearing in context: "${contextSentence}"), provide:
1. "translation": concise English translation of "${phrase}".
2. "exampleTarget": 1 natural example sentence in ${langName} (CEFR ${level}) using "${phrase}".
3. "exampleEn": English translation of that example sentence.
Return valid JSON only: {"translation": "...", "exampleTarget": "...", "exampleEn": "..."}`;

    try {
      if (state.apiSettings.provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.apiSettings.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (!res.ok) return null;
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          phrase,
          translation: parsed.translation,
          exampleTarget: parsed.exampleTarget,
          exampleEn: parsed.exampleEn
        };
      } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          state.apiSettings.apiKey
        )}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        if (!res.ok) return null;
        const data = await res.json();
        const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        return {
          phrase,
          translation: parsed.translation,
          exampleTarget: parsed.exampleTarget,
          exampleEn: parsed.exampleEn
        };
      }
    } catch (e) {
      return null;
    }
  }

  // Handle user selecting a word or highlighting part of a sentence
  async function handlePhraseSelection(rawPhrase, sentenceIndex, clientRect) {
    const cleaned = rawPhrase
      .replace(/\s+/g, " ")
      .replace(/^[.,;:!?¡¿"«()]+|[.,;:!?¡¿"»()]+$/g, "")
      .trim();

    if (!cleaned || cleaned.length < 1) return;

    // Show Confirm Selection Inspector Card in right sidebar
    dom.selectionConfirmCard.classList.remove("hidden");
    dom.selectedLangTag.textContent = `${state.language.toUpperCase()} · ${state.level}`;
    dom.selectedPhraseDisplay.textContent = cleaned;
    dom.exampleLangLabel.textContent = state.language === "es" ? "Spanish" : "Swedish";

    dom.selectionLoadingState.classList.remove("hidden");
    dom.selectionFormFields.classList.add("hidden");

    const details = await lookupSelectionDetails(cleaned, sentenceIndex);
    dom.selectionLoadingState.classList.add("hidden");
    dom.selectionFormFields.classList.remove("hidden");

    if (!details) return;

    state.pendingSelection = {
      term: details.phrase,
      language: state.language,
      level: state.level,
      translation: details.translation,
      exampleTarget: details.exampleTarget,
      exampleEn: details.exampleEn
    };

    dom.confirmTranslationInput.value = details.translation;
    dom.confirmExampleTargetInput.value = details.exampleTarget;
    dom.confirmExampleEnglishInput.value = details.exampleEn;

    // Also position the floating quick-confirm popover near the selection
    if (clientRect) {
      showFloatingPopover(details, clientRect);
    }
  }

  function showFloatingPopover(details, rect) {
    dom.popoverTerm.textContent = details.phrase;
    dom.popoverTrans.textContent = details.translation;
    dom.popoverExample.textContent = `"${details.exampleTarget}" — ${details.exampleEn}`;
    dom.floatingPopover.classList.remove("hidden");

    const popoverWidth = 340;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

    let top = rect.bottom + 10;
    if (top + 150 > window.innerHeight) {
      top = Math.max(12, rect.top - 145);
    }

    dom.floatingPopover.style.left = `${left}px`;
    dom.floatingPopover.style.top = `${top}px`;
  }

  function closeSelectionInspector() {
    state.pendingSelection = null;
    dom.selectionConfirmCard.classList.add("hidden");
    dom.floatingPopover.classList.add("hidden");
    document
      .querySelectorAll(".passage-word.active-selection")
      .forEach((el) => el.classList.remove("active-selection"));
  }

  // Confirm & Save the selected word/sentence part to Vocabulary Inventory
  function confirmAndSaveSelection() {
    if (!state.pendingSelection) return;

    const term = state.pendingSelection.term.trim();
    const translation = dom.confirmTranslationInput.value.trim() || state.pendingSelection.translation;
    const exampleTarget = dom.confirmExampleTargetInput.value.trim() || state.pendingSelection.exampleTarget;
    const exampleEn = dom.confirmExampleEnglishInput.value.trim() || state.pendingSelection.exampleEn;

    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      term,
      language: state.pendingSelection.language,
      level: state.pendingSelection.level,
      translation,
      exampleTarget,
      exampleEn,
      createdAt: new Date().toISOString()
    };

    // Avoid exact duplicate for same language; update if exists
    const existingIdx = state.vocabInventory.findIndex(
      (v) => v.language === newItem.language && v.term.toLowerCase() === newItem.term.toLowerCase()
    );

    if (existingIdx !== -1) {
      state.vocabInventory[existingIdx] = newItem;
    } else {
      state.vocabInventory.unshift(newItem);
    }

    saveVocabToStorage();
    syncVocabToGitHub(`Add "${term}" (${newItem.language.toUpperCase()}) to vocabulary.json`);
    renderInventory();

    // Update highlights in current passage
    if (state.currentPassage) {
      renderPassage(state.currentPassage);
    }

    closeSelectionInspector();
    window.getSelection()?.removeAllRanges();
  }

  // Render Vocabulary Inventory List
  function renderInventory() {
    const totalCount = state.vocabInventory.length;
    dom.inventoryCountBadge.textContent = `${totalCount} saved`;

    const query = state.vocabSearch.toLowerCase().trim();
    const filtered = state.vocabInventory.filter((item) => {
      if (state.vocabFilter !== "all" && item.language !== state.vocabFilter) {
        return false;
      }
      if (query) {
        return (
          item.term.toLowerCase().includes(query) ||
          item.translation.toLowerCase().includes(query) ||
          item.exampleTarget.toLowerCase().includes(query)
        );
      }
      return true;
    });

    dom.inventoryList.innerHTML = "";

    if (filtered.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-inventory";
      emptyDiv.innerHTML =
        totalCount === 0
          ? `<p><strong>Your vocabulary inventory is empty.</strong></p><p style="margin-top:4px;">Click any word or highlight a part of a sentence in the text on the left, then click <em>Confirm &amp; Save</em>.</p>`
          : `<p>No saved vocabulary matches your current filter.</p>`;
      dom.inventoryList.appendChild(emptyDiv);
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "vocab-item";
      const flag = item.language === "es" ? "🇪🇸 ES" : "🇸🇪 SV";

      card.innerHTML = `
        <div class="vocab-item-top">
          <div>
            <div class="vocab-term">${escapeHtml(item.term)}</div>
            <div class="vocab-translation">${escapeHtml(item.translation)}</div>
          </div>
          <div class="vocab-badges">
            <span class="badge badge-lang">${flag}</span>
            <span class="badge badge-level">${escapeHtml(item.level)}</span>
            <button type="button" class="btn-mini-audio" data-speak="${escapeHtml(item.term)}" data-lang="${item.language}" title="Listen">🔊</button>
            <button type="button" class="btn-delete-vocab" data-delete-id="${item.id}" title="Remove from inventory">&times;</button>
          </div>
        </div>
        <div class="vocab-example-box">
          <div class="vocab-example-target">“${escapeHtml(item.exampleTarget)}”</div>
          <div class="vocab-example-en">${escapeHtml(item.exampleEn)}</div>
        </div>
      `;

      dom.inventoryList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Speech synthesis helper
  function speakText(text, langCode) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "es" ? "es-ES" : "sv-SE";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  // Save vocabulary.json file
  function saveInventoryJsonFile() {
    const jsonString = JSON.stringify(state.vocabInventory, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vocabulary.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Load vocabulary.json file from disk
  function handleLoadJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          mergeVocabularyItems(parsed);
          renderInventory();
          if (state.currentPassage) {
            renderPassage(state.currentPassage);
          }
        }
      } catch (err) {
        alert("Invalid JSON file. Please select a valid vocabulary.json file.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  // Export CSV
  function exportInventoryCsv() {
    if (state.vocabInventory.length === 0) return;
    const headers = ["Language", "CEFR Level", "Word or Phrase", "English Translation", "Example Sentence", "Example Translation"];
    const rows = state.vocabInventory.map((v) => [
      v.language === "es" ? "Spanish" : "Swedish",
      v.level,
      v.term,
      v.translation,
      v.exampleTarget,
      v.exampleEn
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `lingoread_vocabulary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Event Listeners
  function bindEvents() {
    // Language switch
    dom.langBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        dom.langBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.language = btn.dataset.lang;
        generatePassage();
      });
    });

    // CEFR Level switch
    dom.levelBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        dom.levelBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.level = btn.dataset.level;
        generatePassage();
      });
    });

    // Topic chips
    dom.topicChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        dom.topicChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const selectedTopic = chip.dataset.topic || "";
        dom.topicInput.value = selectedTopic;
        dom.clearTopicBtn.classList.toggle("hidden", !selectedTopic);
        generatePassage();
      });
    });

    dom.topicInput.addEventListener("input", () => {
      const val = dom.topicInput.value.trim();
      dom.clearTopicBtn.classList.toggle("hidden", !val);
      dom.topicChips.forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.topic === val);
      });
    });

    dom.topicInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        generatePassage();
      }
    });

    dom.clearTopicBtn.addEventListener("click", () => {
      dom.topicInput.value = "";
      dom.clearTopicBtn.classList.add("hidden");
      dom.topicChips.forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.topic === "");
      });
      generatePassage();
    });

    dom.generateBtn.addEventListener("click", () => {
      generatePassage();
    });

    // Toggle parallel translation
    dom.toggleParallelBtn.addEventListener("click", () => {
      dom.parallelTranslationBox.classList.toggle("hidden");
    });

    // Listen to full passage
    dom.speakTextBtn.addEventListener("click", () => {
      if (!state.currentPassage) return;
      const fullText = state.currentPassage.sentences.map((s) => s.target).join(" ");
      speakText(fullText, state.currentPassage.language);
    });

    // Word click or multi-word range highlight inside passage
    dom.passageContainer.addEventListener("mouseup", (e) => {
      const selection = window.getSelection();
      const selectedStr = selection ? selection.toString().trim() : "";

      if (selectedStr && selectedStr.length > 0) {
        // Multi-word or highlighted phrase selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const parentSent =
          range.startContainer.parentElement?.closest(".passage-sentence") ||
          e.target.closest(".passage-sentence");
        const sentIdx = parentSent ? Number(parentSent.dataset.sentIndex || 0) : 0;
        handlePhraseSelection(selectedStr, sentIdx, rect);
        return;
      }

      // Single word click
      const wordEl = e.target.closest(".passage-word");
      if (wordEl) {
        document
          .querySelectorAll(".passage-word.active-selection")
          .forEach((el) => el.classList.remove("active-selection"));
        wordEl.classList.add("active-selection");

        const word = wordEl.dataset.word;
        const sentIdx = Number(wordEl.dataset.sentIndex || 0);
        const rect = wordEl.getBoundingClientRect();
        handlePhraseSelection(word, sentIdx, rect);
      }
    });

    // Confirm and save buttons
    dom.confirmSaveVocabBtn.addEventListener("click", confirmAndSaveSelection);
    dom.popoverQuickConfirmBtn.addEventListener("click", confirmAndSaveSelection);

    dom.popoverEditBtn.addEventListener("click", () => {
      dom.floatingPopover.classList.add("hidden");
      dom.confirmTranslationInput.focus();
    });

    dom.cancelSelectionBtn.addEventListener("click", closeSelectionInspector);

    dom.speakSelectionBtn.addEventListener("click", () => {
      if (state.pendingSelection) {
        speakText(state.pendingSelection.term, state.pendingSelection.language);
      }
    });

    // Inventory actions (delete & audio)
    dom.inventoryList.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest("[data-delete-id]");
      if (deleteBtn) {
        const id = deleteBtn.dataset.deleteId;
        state.vocabInventory = state.vocabInventory.filter((item) => item.id !== id);
        saveVocabToStorage();
        syncVocabToGitHub("Remove item from vocabulary.json");
        renderInventory();
        if (state.currentPassage) renderPassage(state.currentPassage);
        return;
      }

      const speakBtn = e.target.closest("[data-speak]");
      if (speakBtn) {
        speakText(speakBtn.dataset.speak, speakBtn.dataset.lang);
      }
    });

    // Inventory filter tabs
    dom.filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        dom.filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        state.vocabFilter = tab.dataset.filter;
        renderInventory();
      });
    });

    dom.vocabSearchInput.addEventListener("input", () => {
      state.vocabSearch = dom.vocabSearchInput.value;
      renderInventory();
    });

    if (dom.saveJsonBtn) {
      dom.saveJsonBtn.addEventListener("click", saveInventoryJsonFile);
    }

    if (dom.loadJsonInput) {
      dom.loadJsonInput.addEventListener("change", handleLoadJsonFile);
    }

    dom.exportVocabBtn.addEventListener("click", exportInventoryCsv);

    // Close floating popover when clicking outside
    document.addEventListener("mousedown", (e) => {
      if (
        !dom.floatingPopover.classList.contains("hidden") &&
        !dom.floatingPopover.contains(e.target) &&
        !dom.passageContainer.contains(e.target)
      ) {
        dom.floatingPopover.classList.add("hidden");
      }
    });

    // Settings Modal
    const openModal = () => {
      if (dom.githubRepoInput) {
        dom.githubRepoInput.value = state.apiSettings.githubRepo || "timmigol/languageLearningApp";
      }
      if (dom.githubTokenInput) {
        dom.githubTokenInput.value = state.apiSettings.githubToken || "";
      }
      dom.apiProviderSelect.value = state.apiSettings.provider || "gemini";
      dom.apiKeyInput.value = state.apiSettings.apiKey || "";
      dom.settingsModal.classList.remove("hidden");
    };
    const closeModal = () => dom.settingsModal.classList.add("hidden");

    dom.settingsBtn.addEventListener("click", openModal);
    dom.modeBadgeBtn.addEventListener("click", openModal);
    dom.closeSettingsModalBtn.addEventListener("click", closeModal);

    dom.saveApiKeyBtn.addEventListener("click", () => {
      state.apiSettings = {
        provider: dom.apiProviderSelect.value,
        apiKey: dom.apiKeyInput.value.trim(),
        githubRepo: (dom.githubRepoInput?.value || "timmigol/languageLearningApp").trim(),
        githubToken: (dom.githubTokenInput?.value || "").trim()
      };
      localStorage.setItem(STORAGE_KEY_API, JSON.stringify(state.apiSettings));
      updateModeBadge();
      closeModal();
      if (state.apiSettings.githubToken) {
        syncVocabToGitHub("Initial sync of vocabulary.json from LingoRead");
      }
      generatePassage();
    });

    dom.clearApiKeyBtn.addEventListener("click", () => {
      state.apiSettings = {
        provider: "gemini",
        apiKey: "",
        githubRepo: "timmigol/languageLearningApp",
        githubToken: ""
      };
      localStorage.setItem(STORAGE_KEY_API, JSON.stringify(state.apiSettings));
      dom.apiKeyInput.value = "";
      if (dom.githubTokenInput) dom.githubTokenInput.value = "";
      updateModeBadge();
      closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
