<script>
  export let title
  export let subtitle
  export let height
</script>

<main style={`height: ${height ?? 'auto'}; overflow: hidden;`}>
  <h1>{title}</h1>
  <p>{subtitle}</p>
  <slot />
</main>

<style>
  main {
    width: min(680px, 92vw);
    background: #1d1b23;
    border: 1px solid #2d2c33;
    border-radius: 12px;
    padding: 24px;
  }
</style>
