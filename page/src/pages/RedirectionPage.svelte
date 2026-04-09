<script lang="ts">
  import { onMount } from 'svelte'

  let deeplink: string | null = null
  let reminderText: string = 'Reminder'

  onMount(() => {
    const searchParams = new URLSearchParams(window.location.search)
    deeplink = searchParams.get('deeplink')
    reminderText = searchParams.get('reminderText') || 'Reminder'

    if (deeplink) {
      setTimeout(() => {
        window.location.href = deeplink!
      }, 1000)
    }
  })
</script>

<h1>🔔 Reminder</h1>
<div class="reminder-txt">
  <img src="./check.jpg" width="28" alt="check" />
  <span>{reminderText}</span>
</div>
<p>If redirection didn't happen automatically, click this button</p>
{#if deeplink}
  <a href={deeplink}>Open Obsidian</a>
{:else}
  <button disabled>Missing deeplink</button>
{/if}
<p class="caption">it will open Obsidian with your reminder</p>

<style>
  a {
    margin-top: 10px;
    padding: 15px 60px;
    background-color: #164eb6;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    color: #fff;
    font-weight: 500;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: transform ease 200ms;
    cursor: pointer;
  }

  a:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    transform: scale(1.01);
  }

  .reminder-txt {
    background-color: #1d1b23;
    padding: 25px 50px;
    border-radius: 15px;
    font-size: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #27282f;
  }

  .reminder-txt > img {
    margin-right: 20px;
  }

  h1 {
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 15px;
  }

  .caption {
    font-size: 10px;
    font-weight: 100;
    padding: 0px;
    margin-top: 5px;
  }

  button {
    margin-top: 10px;
    padding: 15px 60px;
    background-color: #555;
    border-radius: 10px;
    color: #fff;
    font-weight: 500;
    border: none;
    cursor: not-allowed;
  }
</style>
