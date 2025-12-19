export function clamp(v,a,b){ return Math.max(a,Math.min(b,v)) }

export function hexToRgb(hex){
  const h = hex.replace('#','')
  const bigint = parseInt(h,16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r,g,b }
}
export function hexToRgbString(hex){
  const {r,g,b}=hexToRgb(hex)
  return `rgb(${r}, ${g}, ${b})`
}
export function rgbToHex(r,g,b){
  const ri = Math.round(r), gi = Math.round(g), bi = Math.round(b)
  return '#'+[ri,gi,bi].map(x=> Number(x).toString(16).padStart(2,'0')).join('').toUpperCase()
}

export function toHex(input){
  if (typeof input === 'string') {
    if (input.startsWith('#')) return input.toUpperCase()
    const m = input.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/i)
    if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]))
    return input.toUpperCase()
  }
  if (typeof input === 'object' && input !== null && 'r' in input) {
    return rgbToHex(input.r, input.g, input.b)
  }
  if (arguments.length === 3) {
    return rgbToHex(arguments[0], arguments[1], arguments[2])
  }
  return '#000000'
}

export function hexToHsl(hex){
  const {r,g,b}=hexToRgb(hex)
  return rgbToHsl(r,g,b)
}
export function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h=0,s=0,l=(max+min)/2
  if(max!==min){
    const d = max-min
    s = l > .5 ? d/(2-max-min) : d/(max+min)
    switch(max){
      case r: h = (g-b)/d + (g<b ? 6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) }
}
export function hslToRgb(h,s,l){
  s/=100; l/=100
  function f(n){
    const k = (n + h/30) % 12
    const a = s * Math.min(l,1-l)
    return Math.round(255 * (l - a * Math.max(Math.min(k-3,9-k,1), -1)))
  }
  return { r: f(0), g: f(8), b: f(4) }
}
export function hslToHex(h,s,l){
  const {r,g,b}=hslToRgb(h,s,l)
  return rgbToHex(r,g,b)
}

export function generateByMood(mood, count = 5) {
  const moods = {
    calm: [
      { h: 200, s: 30, l: 70 },
      { h: 180, s: 25, l: 75 },
      { h: 280, s: 20, l: 80 },
      { h: 120, s: 25, l: 70 },
      { h: 40, s: 30, l: 85 },
    ],
    energetic: [
      { h: 0, s: 85, l: 60 },
      { h: 45, s: 90, l: 65 },
      { h: 60, s: 95, l: 65 },
      { h: 135, s: 80, l: 55 },
      { h: 300, s: 85, l: 60 },
    ],
    professional: [
      { h: 220, s: 45, l: 40 },
      { h: 30, s: 25, l: 50 },
      { h: 0, s: 0, l: 30 },
      { h: 60, s: 10, l: 90 },
      { h: 210, s: 35, l: 55 },
    ],
    romantic: [
      { h: 340, s: 50, l: 75 },
      { h: 320, s: 40, l: 80 },
      { h: 280, s: 35, l: 75 },
      { h: 10, s: 45, l: 80 },
      { h: 350, s: 60, l: 70 },
    ],
    nature: [
      { h: 120, s: 60, l: 35 },
      { h: 90, s: 50, l: 40 },
      { h: 40, s: 55, l: 50 },
      { h: 150, s: 45, l: 55 },
      { h: 75, s: 40, l: 65 },
    ]
  };

  if (!moods[mood]) {
    mood = 'calm';
  }

  const baseColors = moods[mood];
  const result = [];
  
  // Случайный индекс для начала, чтобы палитры не всегда начинались одинаково
  const startIndex = Math.floor(Math.random() * baseColors.length);
  
  for (let i = 0; i < count; i++) {
    const baseIndex = (startIndex + i) % baseColors.length;
    const base = baseColors[baseIndex];
    
    // Больше вариаций
    const h = (base.h + Math.floor(i / baseColors.length) * 20 + Math.random() * 15 - 7.5) % 360;
    const s = clamp(base.s + Math.random() * 20 - 10, 15, 85);
    const l = clamp(base.l + Math.random() * 20 - 10, 20, 80);
    
    result.push(hslToHex(h, s, l));
  }
  
  return result;
}

export function addVariation(hex, options = {}) {
  const { hueShift = 10, satShift = 10, lightShift = 10 } = options;
  const hsl = hexToHsl(hex);
  
  return hslToHex(
    (hsl.h + Math.random() * hueShift * 2 - hueShift + 360) % 360,
    clamp(hsl.s + Math.random() * satShift * 2 - satShift, 10, 90),
    clamp(hsl.l + Math.random() * lightShift * 2 - lightShift, 10, 90)
  );
}

export function generateHarmony(baseHex = '#b44f92ff', type = 'analogous', count = 5) {
  // Если выбран тип настроения, используем новую функцию
  if (['calm', 'energetic', 'professional', 'romantic', 'nature'].includes(type)) {
    return generateByMood(type, count);
  }
  
  const base = hexToHsl(baseHex);
  let angles = [];
  
  // Добавим небольшой рандом для большей вариативности
  const randomFactor = Math.random() * 10 - 5; // от -5 до +5
  
  if(type === 'random'){
    for(let i = 0; i < count; i++) {
      angles.push(Math.round(Math.random() * 360));
    }
    angles.sort((a, b) => a - b);
    return angles.map(a => 
      hslToHex(a, 
        clamp(base.s + (Math.random() * 20 - 10), 10, 90),
        clamp(base.l + (Math.random() * 20 - 10), 10, 90)
      )
    );
  }
  
  if(type === 'monochrome'){
    const step = 40 / Math.max(1, count - 1); // увеличил диапазон
    const start = clamp(base.l - 20 + randomFactor, 10, 90); // добавил вариативность
    const out = [];
    
    for(let i = 0; i < count; i++){
      const l = clamp(start + i * step, 6, 95);
      // Добавим небольшие вариации насыщенности
      const s = clamp(base.s + (Math.random() * 10 - 5), 10, 90);
      out.push(hslToHex(base.h, s, l));
    }
    return out;
  }
  
  if(type === 'analogous'){
    const spread = 45; // увеличил спред
    const step = (spread * 2) / Math.max(1, count - 1);
    const out = [];
    
    for(let i = 0; i < count; i++){
      const angle = (base.h - spread + randomFactor) + i * step;
      // Добавим вариации яркости
      const l = clamp(base.l + (Math.random() * 15 - 7.5), 15, 85);
      // Добавим вариации насыщенности
      const s = clamp(base.s + (Math.random() * 15 - 7.5), 15, 85);
      out.push(hslToHex((angle + 360) % 360, s, l));
    }
    return out;
  }
  
  if(type === 'triad'){
    const anchors = [
      base.h, 
      (base.h + 120 + randomFactor) % 360, 
      (base.h + 240 + randomFactor) % 360
    ];
    const out = [];
    
    for(let i = 0; i < count; i++){
      const h = anchors[i % anchors.length];
      const l = clamp(base.l + Math.floor(i / anchors.length) * 12 + (Math.random() * 8 - 4), 15, 85);
      const s = clamp(base.s + (Math.random() * 15 - 7.5), 20, 90);
      out.push(hslToHex(h, s, l));
    }
    return out;
  }
  
  if(type === 'complementary'){
    const comp = (base.h + 180 + randomFactor) % 360;
    const out = [];
    
    for(let i = 0; i < count; i++){
      const t = i / Math.max(1, count - 1);
      // Используем разные цвета для разных индексов
      let h;
      if (count <= 2) {
        h = i === 0 ? base.h : comp;
      } else {
        // Смешиваем цвета для плавного перехода
        h = (base.h + (comp - base.h) * (i / (count - 1))) % 360;
      }
      
      const l = clamp(base.l + (i % 2 === 0 ? -15 : 15) + (Math.random() * 10 - 5), 15, 85);
      const s = clamp(base.s + (Math.random() * 10 - 5), 20, 90);
      out.push(hslToHex(h, s, l));
    }
    return out;
  }
  
  // Fallback
  const res = [];
  for(let i = 0; i < count; i++){ 
    res.push(hslToHex(
      (base.h + i * 30) % 360, 
      clamp(base.s + (Math.random() * 20 - 10), 10, 90),
      clamp(base.l + (i % 2 ? 10 : -10) + (Math.random() * 10 - 5), 10, 90)
    ));
  }
  return res;
}

function relLuminance({r,g,b}){
  const srgb = [r,g,b].map(v=> {
    const c = v/255
    return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4)
  })
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]
}
export function contrastRatio(hexA, hexB){
  const a = relLuminance(hexToRgb(hexA))
  const b = relLuminance(hexToRgb(hexB))
  const L1 = Math.max(a,b), L2 = Math.min(a,b)
  return (L1 + 0.05) / (L2 + 0.05)
}
export function bestContrastText(bgHex){
  const r = contrastRatio(bgHex, '#000000')
  const w = contrastRatio(bgHex, '#FFFFFF')
  return w >= r ? '#FFFFFF' : '#000000'
}

// Подробный анализ контрастности
export function getContrastDetails(hexA, hexB) {
  const ratio = contrastRatio(hexA, hexB);
  
  return {
    ratio: ratio,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Недостаточно',
    score: Math.min(Math.round(ratio * 10), 100)
  };
}

// Анализ всей палитры
export function analyzePalette(colors) {
  const results = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const contrast = getContrastDetails(colors[i], colors[j]);
      results.push({
        colorA: colors[i],
        colorB: colors[j],
        ...contrast
      });
    }
  }
  
  return results;
}

export function formatDateForStorage(date = new Date()) {
  return date.toISOString()
}

export function parseDateFromStorage(dateString) {
  return new Date(dateString)
}

// Получить общий рейтинг доступности палитры
export function getPaletteAccessibilityScore(colors) {
  const analysis = analyzePalette(colors);
  
  if (analysis.length === 0) return { score: 0, level: 'Неизвестно' };
  
  const aaCount = analysis.filter(r => r.aa).length;
  const aaaCount = analysis.filter(r => r.aaa).length;
  const total = analysis.length;
  
  const aaPercentage = (aaCount / total) * 100;
  const aaaPercentage = (aaaCount / total) * 100;
  
  let level = 'Плохо';
  let score = Math.round((aaPercentage + aaaPercentage) / 2);
  
  if (aaaPercentage >= 80) {
    level = 'Отлично (AAA)';
  } else if (aaPercentage >= 80) {
    level = 'Хорошо (AA)';
  } else if (aaPercentage >= 50) {
    level = 'Удовлетворительно';
  }
  
  return { score, level, aaPercentage, aaaPercentage };
}