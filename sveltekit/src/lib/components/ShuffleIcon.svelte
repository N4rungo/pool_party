<script>
  export let size = 20;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <!-- Upper stream: left horizontal then diagonal to lower-right, with arrow -->
  <path d="M2 6 L6 6 L16 14 L18 14"/>
  <polyline points="16 12 18 14 16 16"/>
  <!-- Lower stream: left horizontal then diagonal to upper-right, with arrow -->
  <path d="M2 14 L6 14 L16 6 L18 6"/>
  <polyline points="16 4 18 6 16 8"/>
</svg>
