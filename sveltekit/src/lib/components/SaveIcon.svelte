<script>
  export let size = '1em';
  export let color = 'currentColor';
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
  style="display:inline-block;vertical-align:middle;flex-shrink:0"
>
  <path d="M5 3h11l3 3v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill={color} />
  <rect x="8" y="3" width="8" height="6" rx="1" fill="rgba(0,0,0,0.35)" />
  <rect x="7" y="13" width="10" height="7" rx="1" fill="rgba(0,0,0,0.25)" />
  <rect x="10" y="4" width="2" height="4" rx="0.5" fill="rgba(255,255,255,0.5)" />
</svg>
