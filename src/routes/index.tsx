import { createFileRoute, useNavigate } from '@tanstack/react-router';

import {
  filtersOf,
  LocateNotice,
  NearbySearch,
  positionOf,
  SearchFilters,
  searchParamsSchema,
  useLocateVisitor,
  withFilters,
  withPosition,
  type Position,
  type SearchFilterValues,
} from '@/features/ascents';
import { useScrollProgress } from '@/shared/hooks/use-scroll-progress';

import { HomeHero } from './-components/home-hero';

export const Route = createFileRoute('/')({
  validateSearch: searchParamsSchema,
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const position = positionOf(search);
  const filters = filtersOf(search);
  const reveal = useScrollProgress();

  const searchAround = (center: Position, replace = false) => {
    void navigate({ search: (previous) => withPosition(previous, center), replace });
  };

  // Replace the position-less entry: going back should not ask for the location again.
  const located = useLocateVisitor(position, (center) => {
    searchAround(center, true);
  });

  return (
    <>
      <NearbySearch
        criteria={position && { position, ...filters }}
        filters={
          <SearchFilters
            value={filters}
            onChange={(next: SearchFilterValues) => {
              void navigate({ search: (previous) => withFilters(previous, next), replace: true });
            }}
          />
        }
        notice={position ? undefined : <LocateNotice state={located} />}
        onSearchArea={searchAround}
        reveal={reveal}
      />
      <HomeHero reveal={reveal} />
      {/* Scroll distance that dissolves the name and reveals the map. */}
      <div aria-hidden="true" className="h-[200vh]" />
    </>
  );
}
