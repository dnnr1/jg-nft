import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { buttonVariants } from "@/components/ui/button";
import { IconlyArrowRight } from "@/components/icons";
import { cn } from "cn";
import {
  DEFAULT_PAGE,
  PAGE_SIZE,
  catalogSearchSchema,
  resolveCatalogSearch,
  toRequestParams,
  toUrlSearch,
  type CatalogPatchFn,
  type CatalogUrlSearch,
} from "@/modules/catalog/search-params";
import { catalogListQuery } from "@/modules/catalog/queries";
import { CatalogFilters } from "@/modules/catalog/components/catalog-filters";
import { CatalogGrid } from "@/modules/catalog/components/catalog-grid";
import { CatalogPagination } from "@/modules/catalog/components/catalog-pagination";
import { CatalogSortBar } from "@/modules/catalog/components/catalog-sort-bar";
import { MobileControls } from "@/modules/catalog/components/mobile-controls";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    catalogSearchSchema.parse(search),
  component: HomePage,
});

function HomePage() {
  const rawSearch = Route.useSearch();
  const navigate = useNavigate();
  const search = useMemo(() => resolveCatalogSearch(rawSearch), [rawSearch]);

  const patch = useCallback<CatalogPatchFn>(
    (next, options) => {
      void navigate({
        to: ".",
        replace: options?.replace ?? false,
        resetScroll: false,
        search: (previous) => {
          const merged = {
            ...resolveCatalogSearch(previous as CatalogUrlSearch),
            ...next,
          };
          const page = "page" in next ? merged.page : DEFAULT_PAGE;
          return toUrlSearch({ ...merged, page });
        },
      });
    },
    [navigate],
  );

  const goToPage = useCallback(
    (page: number) => {
      patch({ page });
      document
        .getElementById("catalogo")
        ?.scrollIntoView({ behavior: "instant" });
    },
    [patch],
  );

  const clearFilters = useCallback(() => {
    void navigate({ to: ".", search: {}, resetScroll: false });
  }, [navigate]);

  const listQuery = useQuery(catalogListQuery(toRequestParams(search)));
  const catalog = {
    facets: listQuery.data?.facets,
    loading: listQuery.isPending,
    failed: listQuery.isError,
    retry: () => void listQuery.refetch(),
  };

  return (
    <div>
      <h1 className="sr-only">Início</h1>
      <MobileControls
        search={search}
        facets={catalog.facets}
        loading={catalog.loading}
        failed={catalog.failed}
        onRetry={catalog.retry}
        onPatch={patch}
      />
      <HeroCarousel />
      <section
        id="catalogo"
        aria-label="Catálogo"
        className="mt-4 grid scroll-mt-6 gap-12 md:mt-24 md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)]"
      >
        <aside className="hidden md:block" aria-label="Filtros do catálogo">
          <CatalogFilters
            facets={catalog.facets}
            search={search}
            loading={catalog.loading}
            failed={catalog.failed}
            onRetry={catalog.retry}
            onPatch={patch}
          />
          <div className="mt-6 bg-surface-card">
            <h2 className="text-h2 px-5 pt-6 font-bold text-text-accent">
              NFT EM DESTAQUE
            </h2>
            <p className="text-title mt-4 text-center font-bold text-foreground">
              OFERTA LIMITADA
            </p>
            <img
              src="/assets/nft/sage-nomad-009.png"
              alt="Sage Nomad, NFT em destaque"
              className="mt-4 h-92 w-full rounded-[22px] object-cover"
              width={310}
              height={368}
              loading="lazy"
            />
          </div>
        </aside>
        <div className="min-w-0">
          <CatalogSortBar search={search} onPatch={patch} />
          <CatalogGrid
            query={listQuery}
            search={search}
            skeletonCount={PAGE_SIZE}
            onClearFilters={clearFilters}
          />
          <CatalogPagination
            page={search.page}
            total={listQuery.data?.total ?? 0}
            pageSize={PAGE_SIZE}
            onNavigate={goToPage}
          />
        </div>
      </section>
      <EditorialSection />
      <DiarySection />
    </div>
  );
}

interface HeroSlide {
  title: string;
  desktopTitle: string;
  description: string;
  desktopDescription: string;
  artwork: string;
  artworkAlt: string;
  secondaryArtwork: string;
  secondaryAlt: string;
  inverted: boolean;
}

const HERO_SLIDES: readonly HeroSlide[] = [
  {
    title: "SEJA DONO DA\nCULTURA DIGITAL",
    desktopTitle: "SEJA DONO DO FUTURO\nDA ARTE DIGITAL",
    description: "Descubra NFTs selecionados de criadores do mundo todo.",
    desktopDescription:
      "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.",
    artwork: "/assets/nft/golden-signal-160.png",
    artworkAlt: "Golden Signal, arte digital em destaque",
    secondaryArtwork: "/assets/nft/sage-nomad-009.png",
    secondaryAlt: "Sage Nomad",
    inverted: false,
  },
  {
    title: "DESCUBRA CRIADORES EM ASCENSÃO",
    desktopTitle: "DESCUBRA CRIADORES EM ASCENSÃO",
    description: "Curadoria semanal com obras novas de artistas emergentes.",
    desktopDescription:
      "Curadoria semanal com obras novas de artistas emergentes e consagrados, antes da revelação pública.",
    artwork: "/assets/nft/sage-nomad-009.png",
    artworkAlt: "Sage Nomad, arte digital em destaque",
    secondaryArtwork: "/assets/nft/violet-nomad-314.png",
    secondaryAlt: "Violet Nomad",
    inverted: true,
  },
  {
    title: "COMECE SUA COLEÇÃO AQUI",
    desktopTitle: "COMECE SUA COLEÇÃO AQUI",
    description: "Edições limitadas com procedência verificada.",
    desktopDescription:
      "Edições limitadas, procedência verificada e obras selecionadas para o começo da sua coleção.",
    artwork: "/assets/nft/golden-frequency-071.png",
    artworkAlt: "Golden Frequency, arte digital em destaque",
    secondaryArtwork: "/assets/nft/sage-nomad-009.png",
    secondaryAlt: "Sage Nomad",
    inverted: false,
  },
];

const HERO_BACKDROP_GLOWS = [
  {
    left: "-21.9%",
    top: "-16.3%",
    from: "rgb(221 154 95 / 0.43)",
    to: "rgb(210 138 76 / 0.04)",
  },
  {
    left: "19.9%",
    top: "-5.3%",
    from: "rgb(221 154 95 / 0.37)",
    to: "rgb(210 138 76 / 0)",
  },
] as const;

const AUTOPLAY_MS = 6000;

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const hovered = useRef(false);
  const focused = useRef(false);

  const select = useCallback((index: number) => {
    const normalized = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
    setCurrent(normalized);
    setAnnouncement(
      `Destaque ${normalized + 1} de ${HERO_SLIDES.length}: ${
        HERO_SLIDES[normalized]?.title ?? ""
      }`,
    );
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      if (document.hidden || hovered.current || focused.current) return;
      setCurrent((previous) => (previous + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Destaques"
      aria-roledescription="carrossel"
      tabIndex={0}
      className="relative isolate overflow-hidden rounded-xl md:rounded-none"
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
      onFocusCapture={() => {
        focused.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focused.current = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          select(current + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          select(current - 1);
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 md:hidden!"
        style={{
          backgroundImage:
            "linear-gradient(117deg, rgb(210 138 76 / 0.2), rgb(210 138 76 / 0.1))",
        }}
      >
        {HERO_BACKDROP_GLOWS.map((glow) => (
          <div
            key={glow.left}
            className="absolute rounded-full"
            style={{
              left: glow.left,
              top: glow.top,
              width: "67.8%",
              height: "130.5%",
              backgroundImage: `linear-gradient(160deg, ${glow.from}, ${glow.to})`,
            }}
          />
        ))}
      </div>
      <div className="overflow-hidden touch-pan-y">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const active = index === current;
            return (
              <div
                key={slide.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${HERO_SLIDES.length}`}
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  "grid h-60 min-w-0 flex-[0_0_100%] grid-cols-[minmax(0,1fr)_138px] items-center gap-2 p-4 md:h-112.5 md:grid-cols-2 md:gap-8 md:p-0 lg:gap-27.5",
                  slide.inverted
                    ? "lg:grid-cols-[minmax(0,450px)_minmax(0,1fr)]"
                    : "lg:grid-cols-[minmax(0,1fr)_minmax(0,450px)]",
                )}
              >
                <div className={cn("min-w-0", slide.inverted && "md:order-2")}>
                  <p className="text-body-medium mb-1.5 text-foreground md:mb-2">
                    Bem-vindo à Kurio
                  </p>
                  <h2 className="text-display md:max-lg:text-display-2 mb-1.5 whitespace-pre-line md:mb-1">
                    <span className="md:hidden">{slide.title}</span>
                    <span className="hidden md:inline">
                      {slide.desktopTitle}
                    </span>
                  </h2>
                  <p className="text-body-regular text-text-secondary max-w-139.25 md:mb-5 lg:mb-8">
                    <span className="md:hidden">{slide.description}</span>
                    <span className="hidden md:inline">
                      {slide.desktopDescription}
                    </span>
                  </p>
                  <a
                    href="#catalogo"
                    className={cn(
                      buttonVariants(),
                      "hidden px-8 md:inline-flex",
                    )}
                  >
                    EXPLORAR
                  </a>
                  <a
                    href="#catalogo"
                    className="text-caption-bold flex items-center gap-2 text-text-accent md:hidden"
                  >
                    EXPLORAR
                    <IconlyArrowRight className="size-4.5" aria-hidden="true" />
                  </a>
                </div>
                <picture
                  className={cn(
                    "hidden aspect-square max-h-112.5 w-full md:block",
                    slide.inverted && "md:order-1",
                  )}
                >
                  <img
                    src={slide.artwork}
                    alt={slide.artworkAlt}
                    width={450}
                    height={450}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="size-full rounded-2xl object-cover"
                  />
                </picture>
                <div className="relative h-36.5 w-34.5 md:hidden">
                  <img
                    src={slide.artwork}
                    alt={slide.artworkAlt}
                    width={138}
                    height={138}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="size-34.5 rounded-lg object-cover"
                  />
                  <img
                    src={slide.secondaryArtwork}
                    alt={slide.secondaryAlt}
                    width={58}
                    height={58}
                    className="absolute top-22 left-3.5 size-14.5 rounded-lg object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        aria-label="Controles dos destaques"
        className="relative mx-auto mb-4 flex h-1.75 w-8.25 justify-between md:absolute md:right-[calc(50%+16px)] md:bottom-10.75 md:m-0 md:h-2 md:w-10 lg:right-140"
      >
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Ir para destaque ${index + 1}`}
            aria-current={current === index ? "true" : undefined}
            onClick={() => select(index)}
            className="relative flex size-1.75 cursor-pointer items-center justify-center rounded-full before:absolute before:-inset-x-0.75 before:-inset-y-4.5 md:size-2 md:before:-inset-x-1"
          >
            <span
              aria-hidden="true"
              className="size-full rounded-full bg-primary transition-opacity"
              style={{ opacity: current === index ? 1 : 0.4 }}
            />
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}

const EDITORIAL_CARDS = [
  {
    image: "golden-signal-160",
    title: "Lançamentos gênesis de edição limitada",
    description:
      "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
    tab: "novos",
  },
  {
    image: "golden-frequency-071",
    title: "Arte digital selecionada e muito mais",
    description:
      "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
    tab: "alta",
  },
] as const;

function EditorialSection() {
  return (
    <div className="mt-10 hidden md:mt-24 md:block">
      <div className="grid grid-cols-1 gap-y-10 md:gap-x-7 lg:grid-cols-2">
        {EDITORIAL_CARDS.map((card) => (
          <div
            key={card.image}
            className="grid grid-cols-2 rounded-md bg-surface-card"
          >
            <img
              src={`/assets/nft/${card.image}.png`}
              alt={`${card.image.replace(/-/g, " ")}, arte do marketplace`}
              width={292}
              height={250}
              loading="lazy"
              className="h-62.5 w-73 rounded-[18px]"
            />
            <div className="grid pt-9.25 pr-7.5">
              <div>
                <h2 className="text-body-18-bold mb-1 text-right leading-6 text-foreground">
                  {card.title}
                </h2>
                <p className="text-tiny text-right leading-6 text-text-secondary">
                  {card.description}
                </p>
              </div>
              <Link
                to="/"
                search={{ tab: card.tab, page: 1 }}
                className={cn(
                  buttonVariants(),
                  "ms-auto mt-4 inline-flex w-fit",
                )}
              >
                Explorar
                <IconlyArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIARY_POSTS = [
  {
    image: "golden-frequency-071",
    day: 12,
    minutes: 6,
    title: "Como funciona a propriedade de NFTs",
    excerpt: "Aprenda a colecionar, negociar e verificar ativos digitais.",
  },
  {
    image: "golden-signal-160",
    day: 13,
    minutes: 2,
    title: "10 artistas digitais para acompanhar",
    excerpt: "Conheça criadores que moldam a cultura digital.",
  },
  {
    image: "sage-nomad-009",
    day: 15,
    minutes: 3,
    title: "Raridade, atributos e procedência",
    excerpt: "Entenda raridade, procedência, direitos autorais e utilidade.",
  },
  {
    image: "violet-nomad-314",
    day: 15,
    minutes: 2,
    title: "Como proteger sua carteira",
    excerpt: "Proteja sua carteira, seus ativos e sua identidade.",
  },
] as const;

function DiarySection() {
  return (
    <section id="diario" className="mt-24 hidden scroll-mt-6 md:block">
      <h2 className="text-h2 mb-3 text-center text-foreground">
        Diário da Cunhagem
      </h2>
      <p className="text-body-sm mb-10 text-center text-text-secondary">
        Histórias, guias e insights para colecionadores sobre o universo da
        propriedade digital.
      </p>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {DIARY_POSTS.map((post) => (
          <article
            key={post.title}
            className="overflow-hidden rounded-md bg-surface-card"
          >
            <img
              src={`/assets/nft/${post.image}.png`}
              alt={`${post.image.replace(/-/g, " ")}, imagem ilustrativa`}
              width={268}
              height={195}
              loading="lazy"
              className="h-48.75 w-full object-cover"
            />
            <div className="px-4 py-3">
              <p className="text-tiny font-medium text-text-secondary">
                {post.day} de setembro | Leitura de {post.minutes} min
              </p>
              <h3 className="text-body-lg-bold text-foreground">
                {post.title}
              </h3>
              <p className="text-tiny font-medium text-text-secondary">
                {post.excerpt}
              </p>
              <span
                aria-disabled="true"
                className="text-caption-bold inline-block text-text-accent"
              >
                Ler mais →
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
