import { writable } from 'svelte/store'

interface AppStore {
  swRegistration: ServiceWorkerRegistration | null
}

const defaultState: AppStore = {
  swRegistration: null,
}

const createAppStore = () => {
  const { subscribe, update } = writable<AppStore>(defaultState)

  return {
    subscribe,
    updateSwRegistration: (swRegistration: ServiceWorkerRegistration | null) =>
      update(store => ({ ...store, swRegistration })),
  }
}

export const appStore = createAppStore()
