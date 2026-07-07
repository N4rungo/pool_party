<script>
  export let size = '1em';
  export let color = 'var(--color-gold)';
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
  style="display:inline-block;vertical-align:middle;flex-shrink:0"
>
  <circle cx="12" cy="15" r="6" fill={color} />
  <circle cx="12" cy="15" r="4" fill="rgba(0,0,0,0.2)" />
  <circle cx="12" cy="15" r="2.5" fill={color} />
  <path d="M10 3h4l-1 7h-2L10 3z" fill="#E84545" />
  <path d="M8.5 3h3L10 10H8.5V3z" fill="#3B7FD4" />
</svg>
