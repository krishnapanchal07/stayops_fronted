export function BuildingIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="Illustration of a modern PG building"
    >
      <defs>
        <linearGradient id="stayops-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="420" height="320" fill="url(#stayops-sky)" rx="24" />
      <rect x="48" y="248" width="324" height="16" rx="8" fill="#3d2f96" opacity="0.45" />
      <rect x="86" y="86" width="110" height="170" rx="10" fill="#ffffff" opacity="0.95" />
      <rect x="168" y="48" width="132" height="208" rx="10" fill="#f4f1ff" />
      <rect x="268" y="108" width="86" height="148" rx="10" fill="#ffffff" opacity="0.92" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`l-${row}-${col}`}
            x={104 + col * 28}
            y={108 + row * 26}
            width="18"
            height="16"
            rx="3"
            fill="#6C5DD3"
            opacity={row === 4 && col === 0 ? 0.35 : 0.75}
          />
        )),
      )}
      {[0, 1, 2, 3, 4, 5].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`c-${row}-${col}`}
            x={186 + col * 30}
            y={68 + row * 26}
            width="20"
            height="16"
            rx="3"
            fill="#6C5DD3"
            opacity={0.55 + ((row + col) % 3) * 0.12}
          />
        )),
      )}
      {[0, 1, 2, 3].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`r-${row}-${col}`}
            x={284 + col * 26}
            y={128 + row * 24}
            width="16"
            height="14"
            rx="3"
            fill="#6C5DD3"
            opacity="0.7"
          />
        )),
      )}
      <rect x="202" y="214" width="36" height="42" rx="6" fill="#0F182E" />
      <circle cx="232" cy="236" r="2.5" fill="#C4B5FD" />
    </svg>
  );
}
