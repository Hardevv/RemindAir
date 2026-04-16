<script lang="ts">
  import { onMount } from 'svelte'
  import navaid from 'navaid'

  import { appStore } from './store/store'
  import { registerServiceWorker } from './utils/core'
  import { LandingPage, NotificationsPage, RedirectionPage } from './pages'

  let currentPage: string = 'home'
  let isLoading = true

  onMount(async () => {
    try {
      appStore.updateSwRegistration(await registerServiceWorker())
    } catch {
      isLoading = false
    }
    const router = navaid(import.meta.env.BASE_URL)

    router.on('/', () => {
      currentPage = 'landing'
    })

    router.on('/notifications', () => {
      currentPage = 'notifications'
    })

    router.on('/redirection', () => {
      currentPage = 'redirection'
    })

    router.listen()
  })
</script>

{#if currentPage === 'notifications'}
  <NotificationsPage bind:isLoading />
{:else if currentPage === 'landing'}
  <LandingPage />
{:else if currentPage === 'redirection'}
  <RedirectionPage />
{/if}
