<script lang="ts">
  import { onMount } from 'svelte'
  import { Card } from '../components'
  import { LOCAL_STORAGE_VAPID_KEY } from '../consts'
  import {
    getExistingSubscription,
    removeSavedVAPIDKey,
    requestNotificationPermission,
    urlBase64ToUint8Array,
  } from '../utils/core'
  import { appStore } from '../store/store'

  let swRegistration: ServiceWorkerRegistration | null = null
  let pubVapidKey: string | null = null
  const setPubVapidKey = (key: string | null) => {
    pubVapidKey = key
  }
  let existingSubscription: PushSubscription | null = null
  let notificationPermission = Notification.permission

  export let isLoading = true
  let error = null

  const subscribeToPush = async (swRegistration: ServiceWorkerRegistration | null) => {
    const normalizedKey = pubVapidKey?.trim()
    if (!normalizedKey) throw new Error('VAPID public key is required.')

    localStorage.setItem(LOCAL_STORAGE_VAPID_KEY, normalizedKey)

    if (existingSubscription) return
    if (!swRegistration) throw new Error('Service worker is not registered.')

    try {
      existingSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(normalizedKey),
      })
    } catch (err) {
      isLoading = false
      throw new Error(`Failed to subscribe to push notifications. ${err}`)
    }
  }

  const enablePushNotifications = async () => {
    try {
      await requestNotificationPermission()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error enabling push notifications:', message)
    }
  }

  onMount(async () => {
    swRegistration = $appStore.swRegistration
    const params = new URLSearchParams(window.location.search)
    pubVapidKey = params.get('pubKey')
    const permissionStatus = await navigator.permissions.query({ name: 'notifications' })
    permissionStatus.onchange = () => {
      notificationPermission = Notification.permission
    }

    try {
      existingSubscription = await getExistingSubscription(swRegistration)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      isLoading = false
      console.error('Error during service worker registration or subscription check:', message)
    }

    if (pubVapidKey && !existingSubscription) await subscribeToPush(swRegistration)

    isLoading = false
  })
</script>

<Card
  title="🔔 Obsidian Notifier PWA"
  subtitle="This app only receives push notifications and shows them on your device."
  height="700px">
  {#if isLoading && !error}
    <div class="spinner"></div>
  {/if}

  {#if error}
    <p class="error">Error: {JSON.stringify(error)}</p>
  {/if}

  {#if !isLoading && existingSubscription}
    <div class="row border-t">
      <p>
        You already have subscribed to notification service. If you want, you can remove it by
        clicking
        <button
          class="button-warn mt-m"
          type="button"
          on:click={() => removeSavedVAPIDKey(setPubVapidKey, swRegistration)}
          >Unsubscribe from notifications</button>
      </p>
      <hr />
      <div>
        Copy paste to <code>push-subscriptions.json</code>
        inside your Node server:
        <p class="text-s mt-s">
          It has to be done for each device you want to have notifications on
        </p>
        <br />
        <textarea
          readonly
          class="mt-s"
          rows={15}
          value={JSON.stringify(existingSubscription, null, 2)}></textarea>
      </div>
    </div>
  {/if}
  {#if !isLoading && notificationPermission === 'default'}
    <div class="mt-m enable-notifications">
      <p class="mb-s">
        You don't have notifications enabled. Please enable to receive notifications
      </p>
      <button type="button" class="enable-notifications-btn" on:click={enablePushNotifications}
        >Enable push notifications</button>
    </div>
  {/if}
  {#if !isLoading && notificationPermission === 'denied'}
    <div class="mt-m notifications-disabled">
      <p class="mb-s">
        You have blocked notifications for this app. Please allow to receive notifications
      </p>
      <p class="text-s">
        To enable, please go to your browser settings, find this site and allow notifications.
      </p>
      <a
        class="text-s"
        href="https://support.google.com/chrome/answer/3220216?hl=en&co=GENIE.Platform%3DDesktop"
        >How to enable notifications in chrome</a>
    </div>
  {/if}
  {#if !isLoading && !pubVapidKey}
    <div class="mt-m notifications-disabled">
      <p class="mb-s">
        VAPID public key is missing. Please provide it to subscribe for notifications.
      </p>
      <p class="text-s">
        Please open URL that was provided by RemindAir app. It contains your notifications key
      </p>
    </div>
  {/if}
</Card>

<style>
  .spinner {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid #3a3a3a;
    border-top-color: #7aa2ff;
    animation: spin 0.8s linear infinite;
    flex: 0 0 auto;
    margin: 0 auto;
    margin-top: 38px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .enable-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-color: #141219a7;
    padding: 20px;
    border-radius: 10px;
  }
  .enable-notifications-btn {
    background-color: #7aa2ff;
    text-shadow: 0px 2px 1px rgba(0, 0, 0, 0.3);
  }

  .notifications-disabled {
    display: flex;
    flex-direction: column;
    background-color: #955d3e41;
    padding: 20px;
    border-radius: 10px;
  }
</style>
