import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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

export const Route = createFileRoute('/')({
  validateSearch: searchParamsSchema,
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation('ascents');
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const position = positionOf(search);
  const filters = filtersOf(search);

  const searchAround = (center: Position, replace = false) => {
    void navigate({ search: (previous) => withPosition(previous, center), replace });
  };

  // Replace the position-less entry: going back should not ask for the location again.
  const located = useLocateVisitor(position, (center) => {
    searchAround(center, true);
  });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('search.title')}</h1>
      <SearchFilters
        value={filters}
        onChange={(next: SearchFilterValues) => {
          void navigate({ search: (previous) => withFilters(previous, next), replace: true });
        }}
      />
      <NearbySearch
        criteria={position && { position, ...filters }}
        notice={position ? undefined : <LocateNotice state={located} />}
        onSearchArea={searchAround}
      />
    </section>
  );
}
