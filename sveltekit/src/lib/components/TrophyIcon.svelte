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
  <!-- Cup body -->
  <path d="M7 2h10v8a5 5 0 01-10 0V2z" fill={color} />
  <!-- Left handle -->
  <path d="M7 5H3v3a2 2 0 002 2" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Right handle -->
  <path d="M17 5h4v3a2 2 0 01-2 2" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Stem -->
  <line x1="12" y1="15" x2="12" y2="18" stroke={color} stroke-width="2" stroke-linecap="round" />
  <!-- Base -->
  <rect x="8" y="18" width="8" height="2" rx="1" fill={color} />
</svg>
