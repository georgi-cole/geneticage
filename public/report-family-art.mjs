export const FAMILY_FOLIO_VERSION='assessment-folio-v3';

const palettes={
 'heart-vascular':{accent:'#963F32',cover:'#F4E8E1',paper:'#FCF7F2',soft:'#F1E1D9',light:'#E2A084',dark:'#7A302B'},
 metabolic:{accent:'#53643A',cover:'#ECEDE1',paper:'#FAF9F1',soft:'#E8EBDB',light:'#BEC796',dark:'#45562F'},
 kidney:{accent:'#236068',cover:'#E3EDE9',paper:'#F5F9F5',soft:'#E0EEEA',light:'#86B6AC',dark:'#1D555D'},
 fitness:{accent:'#2D508A',cover:'#E9EEF7',paper:'#F7F9FD',soft:'#E5ECF8',light:'#8EA9DF',dark:'#2B4D8B'},
 'health-profile':{accent:'#875A2C',cover:'#F5ECDD',paper:'#FCF8EF',soft:'#F0E7D5',light:'#DBB273',dark:'#80552C'},
};
export const familyPalette=type=>palettes[type];

const art={
 'heart-vascular':()=>`
  <g fill="none" stroke="url(#kq-flow)" stroke-linecap="round">
   <path stroke-width="19" d="M29 366C91 333 92 273 139 234S209 180 218 124 256 59 282 38"/>
   <path stroke-width="11" d="M132 242C161 217 211 231 244 211S282 168 318 156M216 136C226 101 270 107 294 74M98 285C101 236 74 220 85 165S114 106 136 81"/>
   <path stroke-width="5" d="M240 213C265 201 279 220 321 197M149 228C156 192 143 172 161 146S190 115 186 83M218 119C209 98 219 72 234 52M88 189C70 165 48 161 43 122M84 214C63 202 35 216 10 191M278 84C300 70 308 51 316 36M110 268C138 264 142 287 165 290S202 282 220 267"/>
  </g>
  <g fill="none" stroke="#FFF7ED" opacity=".51" stroke-width="1.2"><path d="M33 361C90 329 91 275 139 232S205 178 218 120 256 57 282 37M149 235c32-11 67-8 94-23s47-45 77-54M96 269c3-40-23-51-11-102"/></g>`,
 metabolic:()=>`
  <g fill="none" stroke-linecap="round">
   ${Array.from({length:6},(_,i)=>`<path d="M${-48+i*7} ${100+i*35}C80 ${62+i*35} 143 ${262+i*11} 222 ${261+i*14}S288 ${205+i*16} 353 ${177+i*27}" stroke="url(#kq-flow)" stroke-width="${i===2?16:9}" opacity="${i%2?.62:.88}"/>`).join('')}
   ${Array.from({length:6},(_,i)=>`<path d="M${63+i*40} 32C${62+i*43} 103 ${60+i*32} 197 ${40+i*36} 269S${22+i*34} 354 ${-4+i*35} 385" stroke="${i%2?'#819259':'#B8BF88'}" stroke-width="${i===3?11:6}" opacity=".68"/>`).join('')}
  </g>`,
 kidney:()=>`
  <g fill="none" stroke="url(#kq-flow)">
   <path d="M300 43C189 45 57 95 38 185s43 174 138 176 144-50 155-104" stroke-width="20" opacity=".36"/>
   ${Array.from({length:7},(_,i)=>`<path d="M${310-i*2} ${64+i*19}C${177+i*5} ${62+i*22} ${78+i*18} ${120+i*8} ${65+i*22} ${187+i*6}S${89+i*20} ${320-i*4} ${172+i*9} ${331-i*11} ${293+i*7} ${284-i*6} ${319+i*3} ${233-i*5}" stroke-width="${i%3===0?8:4}" opacity="${.9-i*.075}"/>`).join('')}
  </g>`,
 fitness:()=>`
  <g fill="none" stroke-linecap="round" stroke="url(#kq-flow)">
   ${Array.from({length:8},(_,i)=>`<path d="M${-19+i*2} ${332+i*11}C${76+i*3} ${328+i*10} ${86+i*6} ${291+i*6} ${123+i*7} ${249+i*4}S${158+i*8} ${205+i*7} ${187+i*8} ${181+i*5} ${225+i*5} ${167+i*5} 263 ${120+i*8} ${278+i*3} ${76+i*8} 333 ${42+i*17}" stroke-width="${i%3===0?8:3.5}" opacity="${.93-i*.05}"/>`).join('')}
  </g>`,
 'health-profile':()=>`
  <g fill="none" stroke-linecap="round">
   <path d="M-5 364C64 337 60 200 138 190S259 201 291 105 331 66 361 72" stroke="url(#kq-flow)" stroke-width="19" opacity=".8"/>
   <path d="M18 391C91 369 151 321 149 260S99 147 160 110 250 137 282 44" stroke="#B17B47" stroke-width="11" opacity=".72"/>
   <path d="M-21 252C45 194 92 224 143 248S247 309 312 237 345 160 364 150" stroke="#D3A766" stroke-width="12" opacity=".8"/>
   <path d="M-12 172C59 142 79 106 103 65s83-48 117 4 21 140 68 167 47 15 66 29" stroke="#9B663B" stroke-width="5" opacity=".75"/>
   <path d="M25 385C95 361 152 311 147 255S101 147 163 113 253 132 281 47M-7 252c58-53 108-29 152-5s101 54 165-13" stroke="#FFF6E4" stroke-width="1.4" opacity=".74"/>
  </g>`,
};

export function familyCoverArt(type){
 const palette=familyPalette(type);
 return `<svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
 <linearGradient id="kq-flow" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0" stop-color="${palette.dark}"/><stop offset=".6" stop-color="${palette.accent}"/><stop offset="1" stop-color="${palette.light}"/></linearGradient>
 </defs>${art[type]()}</svg>`;
}
