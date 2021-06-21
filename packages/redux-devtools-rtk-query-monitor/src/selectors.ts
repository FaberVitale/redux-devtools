import { Action, createSelector, Selector } from '@reduxjs/toolkit';
import { RtkQueryInspectorProps } from './containers/RtkQueryInspector';
import { ApiStats, QueryInfo, RtkQueryTag, SelectorsSource } from './types';
import { Comparator, queryComparators } from './utils/comparators';
import { FilterList, queryListFilters } from './utils/filters';
import { escapeRegExpSpecialCharacter } from './utils/regexp';
import {
  getApiStatesOf,
  extractAllApiQueries,
  flipComparator,
  getQueryTagsOf,
  generateApiStatsOfCurrentQuery,
} from './utils/rtk-query';

type InspectorSelector<S, Output> = Selector<SelectorsSource<S>, Output>;

export function computeSelectorSource<S, A extends Action<unknown>>(
  props: RtkQueryInspectorProps<S, A>,
  previous: SelectorsSource<S> | null = null
): SelectorsSource<S> {
  const { computedStates, currentStateIndex, monitorState } = props;

  const userState =
    computedStates.length > 0 ? computedStates[currentStateIndex].state : null;

  if (
    !previous ||
    previous.userState !== userState ||
    previous.monitorState !== monitorState
  ) {
    return {
      userState,
      monitorState,
    };
  }

  return previous;
}

export interface InspectorSelectors<S> {
  readonly selectQueryComparator: InspectorSelector<S, Comparator<QueryInfo>>;
  readonly selectApiStates: InspectorSelector<
    S,
    ReturnType<typeof getApiStatesOf>
  >;
  readonly selectAllQueries: InspectorSelector<
    S,
    ReturnType<typeof extractAllApiQueries>
  >;
  readonly selectAllVisbileQueries: InspectorSelector<S, QueryInfo[]>;
  readonly selectCurrentQueryInfo: InspectorSelector<S, QueryInfo | null>;
  readonly selectSearchQueryRegex: InspectorSelector<S, RegExp | null>;
  readonly selectCurrentQueryTags: InspectorSelector<S, RtkQueryTag[]>;
  readonly selectApiStatsOfCurrentQuery: InspectorSelector<S, ApiStats | null>;
}

export function createInspectorSelectors<S>(): InspectorSelectors<S> {
  const selectQueryComparator = ({
    monitorState,
  }: SelectorsSource<S>): Comparator<QueryInfo> => {
    return queryComparators[monitorState.queryForm.values.queryComparator];
  };

  const selectQueryListFilter = ({
    monitorState,
  }: SelectorsSource<S>): FilterList<QueryInfo> => {
    return queryListFilters[monitorState.queryForm.values.queryFilter];
  };

  const selectApiStates = createSelector(
    ({ userState }: SelectorsSource<S>) => userState,
    getApiStatesOf
  );
  const selectAllQueries = createSelector(
    selectApiStates,
    extractAllApiQueries
  );

  const selectSearchQueryRegex = createSelector(
    ({ monitorState }: SelectorsSource<S>) =>
      monitorState.queryForm.values.searchValue,
    (searchValue) => {
      if (searchValue.length >= 3) {
        return new RegExp(escapeRegExpSpecialCharacter(searchValue), 'i');
      }
      return null;
    }
  );

  const selectComparatorOrder = ({ monitorState }: SelectorsSource<S>) =>
    monitorState.queryForm.values.isAscendingQueryComparatorOrder;

  const selectAllVisbileQueries = createSelector(
    [
      selectQueryComparator,
      selectQueryListFilter,
      selectAllQueries,
      selectComparatorOrder,
      selectSearchQueryRegex,
    ],
    (comparator, queryListFilter, queryList, isAscending, searchRegex) => {
      const filteredList = queryListFilter(
        searchRegex,
        queryList as QueryInfo[]
      );

      const computedComparator = isAscending
        ? comparator
        : flipComparator(comparator);

      return filteredList.slice().sort(computedComparator);
    }
  );

  const selectCurrentQueryInfo = createSelector(
    selectAllQueries,
    ({ monitorState }: SelectorsSource<S>) => monitorState.selectedQueryKey,
    (allQueries, selectedQueryKey) => {
      if (!selectedQueryKey) {
        return null;
      }

      const currentQueryInfo =
        allQueries.find(
          (query) =>
            query.queryKey === selectedQueryKey.queryKey &&
            selectedQueryKey.reducerPath === query.reducerPath
        ) || null;

      return currentQueryInfo;
    }
  );

  const selectCurrentQueryTags = createSelector(
    selectApiStates,
    selectCurrentQueryInfo,
    (apiState, currentQueryInfo) => getQueryTagsOf(currentQueryInfo, apiState)
  );

  const selectApiStatsOfCurrentQuery = createSelector(
    selectApiStates,
    selectCurrentQueryInfo,
    (apiState, currentQueryInfo) =>
      generateApiStatsOfCurrentQuery(currentQueryInfo, apiState)
  );

  return {
    selectQueryComparator,
    selectApiStates,
    selectAllQueries,
    selectAllVisbileQueries,
    selectSearchQueryRegex,
    selectCurrentQueryInfo,
    selectCurrentQueryTags,
    selectApiStatsOfCurrentQuery,
  };
}