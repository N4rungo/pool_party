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
  <!-- Skull dome -->
  <path d="M12 3C7.58 3 4 6.58 4 11c0 2.42 1.07 4.59 2.76 6.08V19a1 1 0 001 1h8.48a1 1 0 001-1v-1.92C18.93 15.59 20 13.42 20 11c0-4.42-3.58-8-8-8z" fill={color} />
  <!-- Left eye socket -->
  <circle cx="9" cy="11" r="1.8" fill="rgba(0,0,0,0.55)" />
  <!-- Right eye socket -->
  <circle cx="15" cy="11" r="1.8" fill="rgba(0,0,0,0.55)" />
  <!-- Nose -->
  <rect x="11" y="13.5" width="2" height="1.5" rx="0.5" fill="rgba(0,0,0,0.4)" />
  <!-- Teeth -->
  <rect x="8.5" y="19" width="2" height="1.5" rx="0.4" fill={color} />
  <rect x="11" y="19" width="2" height="1.5" rx="0.4" fill={color} />
  <rect x="13.5" y="19" width="2" height="1.5" rx="0.4" fill={color} />
</svg>
