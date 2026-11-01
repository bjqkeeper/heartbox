const stars = [
  [7, 18, 0, 2], [16, 62, 3, 2], [24, 12, 6, 3], [31, 78, 2, 2],
  [40, 25, 5, 2], [48, 7, 1, 3], [53, 54, 7, 2], [58, 20, 2, 2],
  [64, 75, 5, 3], [68, 11, 0, 2], [73, 42, 4, 2], [77, 83, 1, 2],
  [81, 16, 6, 3], [87, 64, 3, 2], [92, 29, 1, 3], [96, 72, 5, 2],
] as const;

export function NightStars() {
  return <div className="night-sky" aria-hidden="true">
    {stars.map(([left, top, delay, size], index) => <i key={index} className="night-star" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `${delay}s` }} />)}
  </div>;
}

export function SleepingFox() {
  return <svg className="night-fox" viewBox="0 0 300 170" aria-hidden="true">
    <defs>
      <linearGradient id="fox-coat" x1=".15" y1=".1" x2=".85" y2="1"><stop stopColor="#edb083" /><stop offset=".55" stopColor="#d98a6a" /><stop offset="1" stopColor="#ad5f5e" /></linearGradient>
      <linearGradient id="fox-tail-coat" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5a276" /><stop offset="1" stopColor="#ab6060" /></linearGradient>
      <linearGradient id="fox-cream" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1dd" /><stop offset="1" stopColor="#efd0b9" /></linearGradient>
    </defs>
    <ellipse cx="153" cy="151" rx="130" ry="11" fill="#081128" opacity=".32" />
    <g className="fox-tail">
      <path d="M186 123 C224 118 250 105 256 75 C260 57 250 42 235 38 C265 33 286 52 286 80 C286 119 257 143 207 150 C193 151 181 143 186 123Z" fill="url(#fox-tail-coat)" stroke="#82515c" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M249 39 C268 43 283 58 286 79 C285 91 282 101 276 108 C278 75 263 58 241 54Z" fill="url(#fox-cream)" />
      <path d="M262 51 C275 62 279 79 275 96" fill="none" stroke="#fff5e5" strokeWidth="2" opacity=".55" strokeLinecap="round" />
    </g>
    <g className="fox-breath">
      <path d="M61 125 C68 87 97 61 145 61 C188 61 224 82 224 118 C224 137 208 147 184 149 L100 149 C76 148 60 142 61 125Z" fill="url(#fox-coat)" stroke="#85505a" strokeWidth="2.5" />
      <path d="M99 133 C120 145 163 148 188 136 C180 146 159 151 132 151 L105 149Z" fill="url(#fox-cream)" opacity=".92" />
      <path d="M161 74 C181 77 198 88 205 101" fill="none" stroke="#f6c39b" strokeWidth="3" opacity=".55" strokeLinecap="round" />
      <path d="M196 120 C204 125 207 135 203 140 C197 145 182 144 174 138" fill="none" stroke="#9d5c60" strokeWidth="2" strokeLinecap="round" />
      <path d="M111 136 C126 144 143 145 155 141" fill="none" stroke="#a76460" strokeWidth="2" strokeLinecap="round" />
      <path d="M43 100 L46 60 L66 74 C77 69 90 67 102 73 L118 52 L124 100 C128 122 111 141 83 143 C57 143 40 126 43 100Z" fill="url(#fox-coat)" stroke="#85505a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M49 66 L64 78 L49 86Z M115 60 L102 77 L120 88Z" fill="#b56867" />
      <path d="M54 73 L62 79 L52 82Z M111 68 L103 79 L116 83Z" fill="#f5c4ad" />
      <path d="M43 106 C52 110 64 109 75 101 C80 111 83 117 88 120 C93 115 97 110 101 101 C109 107 117 109 125 105 C119 127 101 143 81 143 C61 143 48 130 43 106Z" fill="url(#fox-cream)" />
      <path d="M59 103 Q66 109 73 103 M101 102 Q108 109 115 102" fill="none" stroke="#644b5b" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M80 118 Q86 122 91 118 Q87 127 80 118Z" fill="#624858" />
      <path d="M86 124 Q82 130 75 129 M86 124 Q90 130 97 129" fill="none" stroke="#987176" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M49 113 C52 128 65 138 80 141" fill="none" stroke="#fff8e9" strokeWidth="2" opacity=".65" strokeLinecap="round" />
    </g>
  </svg>;
}
