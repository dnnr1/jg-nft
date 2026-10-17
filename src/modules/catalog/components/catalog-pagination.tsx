import { Button } from "@/components/ui/button";

interface CatalogPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onNavigate: (page: number) => void;
}

function windowedPages(page: number, count: number): number[] {
  const first = Math.max(1, Math.min(page - 2, count - 4));
  return Array.from(
    { length: Math.min(5, count) },
    (_, index) => first + index,
  );
}

export function CatalogPagination({
  page,
  total,
  pageSize,
  onNavigate,
}: CatalogPaginationProps) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-10 flex flex-wrap justify-end gap-2 md:mt-22 text-xl"
    >
      {page > 1 ? (
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          onClick={() => onNavigate(page - 1)}
        >
          ‹
        </Button>
      ) : null}
      {windowedPages(page, count).map((value) => (
        <Button
          key={value}
          size="icon"
          variant={page === value ? "default" : "outline"}
          aria-label={`Página ${value}`}
          aria-current={page === value ? "page" : undefined}
          onClick={() => onNavigate(value)}
        >
          {value}
        </Button>
      ))}
      {page < count ? (
        <Button
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          onClick={() => onNavigate(page + 1)}
        >
          ›
        </Button>
      ) : null}
    </nav>
  );
}
