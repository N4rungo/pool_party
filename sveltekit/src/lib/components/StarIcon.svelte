<script>
  export let filled = false;
  export let size = '1em';
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
  style="display:inline-block;vertical-align:middle;flex-shrink:0"
>
  <polygon
    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
  />
</svg>
