/** Original, local artwork; never presented as a photograph of a listed room. */
export function RoomScene({ variant = 'room' }: { variant?: 'room' | 'study' | 'lounge' }) {
  return (
    <svg
      viewBox="0 0 800 600"
      role="img"
      aria-label={`Illustration of a comfortable ${variant === 'room' ? 'PG bedroom' : variant === 'study' ? 'study space' : 'shared lounge'}`}
    >
      <rect width="800" height="600" fill="#e9e5dd" />
      <path d="M0 0H800V430H0Z" fill={variant === 'study' ? '#d8ddd5' : '#ede9e1'} />
      <path d="M0 430H800V600H0Z" fill="#bb9c7e" />
      <path d="M0 0L160 65V430L0 515Z" fill="#d1c9bd" />
      <path
        d="M160 430H800M0 515L800 490M0 575L800 540M300 430L240 600M550 430L600 600"
        stroke="#a88a6c"
        strokeWidth="2"
      />
      <rect x="198" y="65" width="210" height="265" rx="3" fill="#faf9f4" />
      <rect x="209" y="76" width="188" height="242" fill="#b6c9c6" />
      <path d="M218 310L310 120L397 260V318H209Z" fill="#a1b6a1" />
      <path d="M303 76V318M209 194H397" stroke="#faf9f4" strokeWidth="9" />
      <path d="M178 60H216L205 338H170ZM390 60H429L439 338H401Z" fill="#b9a58f" />
      <rect x="510" y="100" width="121" height="143" fill="#a08364" />
      <rect x="518" y="108" width="105" height="127" fill="#f6f0e3" />
      <path d="M538 216Q540 149 573 134Q611 160 603 216Z" fill="#9b987e" />
      <circle cx="582" cy="145" r="15" fill="#cdaa7b" />
      {variant === 'study' ? (
        <>
          <path d="M272 350H694V377H272Z" fill="#9c7652" />
          <path d="M296 377V515M671 377V515" stroke="#66543e" strokeWidth="13" />
          <rect x="398" y="272" width="145" height="80" rx="5" fill="#343d3a" />
          <rect x="405" y="279" width="131" height="64" fill="#b7c4be" />
          <path d="M440 452V380Q494 365 536 390V452Z" fill="#777b65" />
          <path d="M444 450L431 533M532 450L551 533" stroke="#5d574b" strokeWidth="9" />
        </>
      ) : (
        <>
          <rect
            x="350"
            y="292"
            width="350"
            height="180"
            rx="19"
            fill={variant === 'lounge' ? '#738472' : '#978c75'}
          />
          <path d="M325 405L661 400L751 512L355 533L280 479Z" fill="#dfd8c7" />
          <path d="M355 533L751 512V546L355 570L280 515V479Z" fill="#96846a" />
          <path d="M333 398L655 393L704 445L337 467L295 441Z" fill="#faf7ef" />
          <path
            d="M474 405L649 398L732 503L550 514Z"
            fill={variant === 'lounge' ? '#a7aa92' : '#b5a3c8'}
          />
          <rect
            x="360"
            y="357"
            width="125"
            height="57"
            rx="16"
            fill="#f9f5ec"
            transform="rotate(-3 360 357)"
          />
          <rect
            x="506"
            y="353"
            width="119"
            height="53"
            rx="16"
            fill="#e7dfcf"
            transform="rotate(-3 506 353)"
          />
        </>
      )}
      <path d="M188 397H257V474H188Z" fill="#957958" />
      <path d="M200 396V341H245V396" fill="#e3d3b4" />
      <path
        d="M723 434V319M724 375Q674 361 686 325Q730 322 724 375M723 348Q764 334 757 300Q721 303 723 348"
        fill="#697d5d"
        stroke="#697d5d"
        strokeWidth="5"
      />
      <path d="M696 422H749L741 478H704Z" fill="#b7775c" />
      <path d="M218 318L406 318L600 600H325Z" fill="#fff8d6" opacity=".12" />
    </svg>
  );
}
