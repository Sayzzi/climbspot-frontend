import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import {
  filtersOf,
  LocateNotice,
  NearbySearch,
  positionOf,
  SEARCH_MAP_ID,
  SEARCH_PANEL_ID,
  SearchFilters,
  searchParamsSchema,
  useLocateVisitor,
  withFilters,
  withPosition,
  type Position,
  type SearchFilterValues,
} from '@/features/ascents';
import { useItineraryPlanner } from '@/features/itineraries';

import { HomeHero } from './-components/home-hero';
import { useWelcome } from './-components/use-welcome';

export const Route = createFileRoute('/')({
  // `welcome`: the logo asks for the welcome screen again.
  validateSearch: searchParamsSchema.extend({
    welcome: z.boolean().optional().catch(undefined),
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const position = positionOf(search);
  const filters = filtersOf(search);
  const welcome = useWelcome(search.welcome === true, () => {
    void navigate({
      search: ({ welcome: _asked, ...rest }) => rest,
      replace: true,
      resetScroll: false,
    });
  });
  const planner = useItineraryPlanner();

  // Searches stay on the map: the router must not scroll back to the title.
  const searchAround = (center: Position, replace = false) => {
    void navigate({
      search: (previous) => withPosition(previous, center),
      replace,
      resetScroll: false,
    });
  };

  // A first visit asks for the location only once the Visitor chooses "Climbs near me".
  const [locationWanted, setLocationWanted] = useState(!welcome.open);
  // Replace the position-less entry: going back should not ask for the location again.
  const located = useLocateVisitor(
    position,
    (center) => {
      searchAround(center, true);
    },
    locationWanted,
  );

  return (
    <>
      <NearbySearch
        criteria={position && { position, ...filters }}
        filters={
          <SearchFilters
            value={filters}
            onChange={(next: SearchFilterValues) => {
              void navigate({
                search: (previous) => withFilters(previous, next),
                replace: true,
                resetScroll: false,
              });
            }}
          />
        }
        notice={position ? undefined : <LocateNotice state={located} />}
        onSearchArea={searchAround}
        onShowEveryAscent={() => {
          void navigate({
            search: (previous) => withFilters(previous, { ...filters, favouritesOnly: undefined }),
            replace: true,
            resetScroll: false,
          });
        }}
        behindWelcome={welcome.open}
        extraTabs={[planner]}
      />
      {welcome.open && (
        <HomeHero
          closing={welcome.closing}
          onShowAscents={() => {
            setLocationWanted(true);
            welcome.close(() => {
              focus(SEARCH_PANEL_ID);
            });
          }}
          onExploreMap={() => {
            welcome.close(() => {
              focus(SEARCH_MAP_ID);
            });
          }}
        />
      )}
    </>
  );
}

/** Moves the focus to what the Visitor asked for: the map, or the search panel. */
function focus(id: string) {
  document.getElementById(id)?.focus();
}
