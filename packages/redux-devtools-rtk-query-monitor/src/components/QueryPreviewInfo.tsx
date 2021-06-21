import { createSelector, Selector } from '@reduxjs/toolkit';
import React, { ReactNode, PureComponent } from 'react';
import {
  QueryInfo,
  QueryPreviewTabProps,
  RtkQueryState,
  RTKStatusFlags,
} from '../types';
import { identity } from '../utils/object';
import { getQueryStatusFlags } from '../utils/rtk-query';
import { TreeView } from './TreeView';

type ComputedQueryInfo = {
  startedAt: string;
  latestFetchAt: string;
};

interface FormattedQuery extends ComputedQueryInfo {
  queryKey: string;
  reducerPath: string;
  statusFlags: RTKStatusFlags;
  query: RtkQueryState;
}

export class QueryPreviewInfo extends PureComponent<QueryPreviewTabProps> {
  selectFormattedQuery: Selector<
    QueryPreviewTabProps['queryInfo'],
    FormattedQuery | null
  > = createSelector(
    identity,
    (queryInfo: QueryInfo | null): FormattedQuery | null => {
      if (!queryInfo) {
        return null;
      }

      const { query, queryKey, reducerPath } = queryInfo;

      const startedAt = query.startedTimeStamp
        ? new Date(query.startedTimeStamp).toISOString()
        : '-';

      const latestFetchAt = query.fulfilledTimeStamp
        ? new Date(query.fulfilledTimeStamp).toISOString()
        : '-';

      const statusFlags = getQueryStatusFlags(query);

      return {
        queryKey,
        reducerPath,
        startedAt,
        latestFetchAt,
        statusFlags,
        query: queryInfo.query,
      };
    }
  );

  render(): ReactNode {
    const { queryInfo, isWideLayout, base16Theme, styling, invertTheme } =
      this.props;

    const formattedQuery = this.selectFormattedQuery(queryInfo);

    if (!formattedQuery) {
      return null;
    }

    return (
      <TreeView
        data={formattedQuery}
        isWideLayout={isWideLayout}
        base16Theme={base16Theme}
        styling={styling}
        invertTheme={invertTheme}
      />
    );
  }
}