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
  return <svg className="night-fox" viewBox="0 0 260 170" aria-hidden="true">
    <defs>
      <linearGradient id="fox-fur" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5a679" /><stop offset="1" stopColor="#bc6e5c" /></linearGradient>
      <linearGradient id="fox-tail-color" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d99572" /><stop offset="1" stopColor="#a85f58" /></linearGradient>
    </defs>
    <ellipse cx="133" cy="148" rx="105" ry="13" fill="#0a1327" opacity=".33" />
    <g className="fox-tail">
      <path d="M155 117 C188 111 220 109 228 80 C235 55 217 42 196 50 C221 29 247 43 251 70 C258 111 221 147 167 145 Z" fill="url(#fox-tail-color)" stroke="#804d50" strokeWidth="3" />
      <path d="M220 48 C235 50 247 61 250 77 C250 90 246 101 240 110 C244 81 227 65 208 63 Z" fill="#f4dbc7" opacity=".95" />
    </g>
    <g className="fox-breath">
      <path d="M64 106 C67 67 106 52 146 64 C181 73 197 105 179 131 C167 149 117 150 83 137 Z" fill="url(#fox-fur)" stroke="#834e50" strokeWidth="3" />
      <path d="M96 119 C116 137 152 139 171 128 C154 151 106 152 83 136 Z" fill="#f8e5d3" opacity=".9" />
      <path d="M37 93 L42 53 L68 70 C82 62 98 62 112 70 L123 47 L135 92 C147 121 123 147 86 147 C58 147 36 128 37 93 Z" fill="url(#fox-fur)" stroke="#834e50" strokeWidth="3" />
      <path d="M45 60 L62 73 L48 83 Z M123 57 L111 76 L130 83 Z" fill="#efc5ad" />
      <path d="M40 107 C50 113 62 111 76 100 C81 113 85 118 88 120 C92 117 97 110 101 100 C113 112 127 111 138 103 C132 135 111 149 86 148 C61 147 46 131 40 107 Z" fill="#f8e6d5" />
      <path d="M58 104 Q66 111 74 103 M102 103 Q110 111 118 103" fill="none" stroke="#694758" strokeWidth="3" strokeLinecap="round" />
      <path d="M81 119 Q87 124 93 119 Q88 131 81 119 Z" fill="#684753" />
      <path d="M88 125 Q86 133 78 133 M88 125 Q90 133 98 133" fill="none" stroke="#9b6d68" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="128" cy="141" rx="22" ry="7" fill="#f5d5bb" />
    </g>
  </svg>;
}
