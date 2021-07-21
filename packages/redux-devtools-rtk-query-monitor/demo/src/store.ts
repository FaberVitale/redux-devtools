import { configureStore, Middleware } from '@reduxjs/toolkit';
import { pokemonApi } from './services/pokemon';
import { postsApi } from 'services/posts';
import DevTools from './features/DevTools/DevTools';
import { isExtensionEnabled } from 'features/DevTools/helpers';

const devTools = isExtensionEnabled();

export const store = configureStore({
  reducer: {
    [pokemonApi.reducerPath]: pokemonApi.reducer,
    [postsApi.reducerPath]: postsApi.reducer,
  },
  devTools,
  // adding the api middleware enables caching, invalidation, polling and other features of `rtk-query`
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      pokemonApi.middleware,
      postsApi.middleware,
    ] as Middleware[]),
  enhancers: devTools ? [] : [DevTools.instrument()],
});
