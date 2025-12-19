<template>
  <section class="generator">
    <div class="controls-row">
      <ControlsPanel
        v-model:count="count"
        v-model:format="format"
        v-model:baseColor="baseColor"
        v-model:paletteType="paletteType"
        :darkBg="darkBg"
        @toggle-bg="darkBg = !darkBg"
        @random="onRandom"
      />
      <div class="actions">
        <div v-if="isMoodPalette && moodInfo" class="mood-info">
          <span style="font-size: 1.2em">{{ moodInfo.icon }}</span>
          <span>{{ moodInfo.desc }}</span>
        </div>
        
        <!-- Индикатор доступности -->
        <div class="accessibility-badge" :class="accessibilityLevelClass">
          <span class="score">{{ accessibilityScore.score }}%</span>
          <span class="level">{{ accessibilityScore.level }}</span>
        </div>
        
        <button class="btn primary" @click="generate">Сгенерировать</button>
        <button class="btn secondary" @click="shufflePalette">Встряхнуть</button>
        <button class="btn" @click="savePalette">Сохранить</button>
        <label class="small-muted">
          <input type="checkbox" v-model="pinMode"> 
          Режим закрепления (клик закрепляет)
        </label>
      </div>
    </div>
        <div class="preview-area" :class="{ dark: darkBg }">
      <!-- Цветовой круг -->
      <div class="color-wheel-container">
        <h3>Цветовой круг</h3>
        <div class="color-wheel-wrapper">
          <canvas ref="colorWheelCanvas" :width="canvasSize" :height="canvasSize" class="color-wheel"></canvas>
          <div class="wheel-center">
            <div class="current-base" :style="{ backgroundColor: baseColor }"></div>
          </div>
        </div>
        <div class="wheel-legend">
          <div class="legend-item" v-for="(color, idx) in displayColors" :key="idx">
            <span class="legend-color" :style="{ backgroundColor: color }"></span>
            <span class="legend-text">Цвет {{ idx + 1 }}</span>
          </div>
        </div>
      </div>

      <div class="palette-row">
        <ColorCard
          v-for="(c, idx) in displayColors"
          :key="idx"
          :color="c"
          :format="format"
          :pinned="!!pinned[idx]"
          @copy="notifyCopy"
          @toggle-pin="togglePin(idx)"
          @card-click="onColorClick(idx)"
        />
      </div>

      <div class="mockup">
        <h2 :style="{ color: displayColors[0] }">Заголовок — превью</h2>
        <button
          :style="{ background: displayColors[1], color: contrastText(displayColors[1]) }"
          class="mock-btn"
        >
          Кнопка
        </button>
        <div class="card" :style="{ background: displayColors[2], color: contrastText(displayColors[2]) }">
          Карточка
        </div>
      </div>

      <div class="analysis">
        <div class="analysis-header">
          <h3>Контрастность пар цветов</h3>
          <p class="analysis-subtitle">Показывает, насколько хорошо сочетаются цвета между собой</p>
        </div>

        <!-- Визуальная легенда -->
        <div class="contrast-legend">
          <div class="legend-title">Уровни контрастности:</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color excellent"></div>
              <div class="legend-text">
                <strong>AAA (≥ 7:1)</strong>
                <small>Отличный контраст</small>
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-color good"></div>
              <div class="legend-text">
                <strong>AA (≥ 4.5:1)</strong>
                <small>Хороший контраст</small>
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-color warning"></div>
              <div class="legend-text">
                <strong>AA Large (≥ 3:1)</strong>
                <small>Только для крупного текста</small>
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-color poor"></div>
              <div class="legend-text">
                <strong>< 3:1</strong>
                <small>Недостаточный контраст</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Упрощённая матрица контрастности -->
        <div class="contrast-matrix">
          <div class="matrix-title">Сравнение цветов:</div>
          
          <!-- Заголовки столбцов (цвета) -->
          <div class="matrix-header">
            <div class="header-corner"></div>
            <div v-for="(color, idx) in displayColors" :key="idx" class="color-header">
              <div class="color-sample" :style="{ backgroundColor: color }"></div>
              <span class="color-label">Цвет {{ idx + 1 }}</span>
            </div>
          </div>

          <!-- Строки матрицы -->
          <div v-for="(rowColor, rowIdx) in displayColors" :key="rowIdx" class="matrix-row">
            <!-- Заголовок строки -->
            <div class="row-header">
              <div class="color-sample" :style="{ backgroundColor: rowColor }"></div>
              <span class="color-label">Цвет {{ rowIdx + 1 }}</span>
            </div>

            <!-- Ячейки контраста -->
            <div v-for="(colColor, colIdx) in displayColors" :key="colIdx" class="matrix-cell">
              <template v-if="colIdx > rowIdx">
                <!-- Активная ячейка с контрастом -->
                <div class="contrast-info" 
                    :class="getContrastClass(contrastMatrix[rowIdx][colIdx])"
                    @click="showContrastDetails(rowIdx, colIdx)">
                  <div class="contrast-ratio">
                    {{ contrastMatrix[rowIdx][colIdx]?.ratio.toFixed(2) }}
                  </div>
                  <div class="contrast-level">
                    <span v-if="contrastMatrix[rowIdx][colIdx]?.aaa" class="icon">✓✓</span>
                    <span v-else-if="contrastMatrix[rowIdx][colIdx]?.aa" class="icon">✓</span>
                    <span v-else-if="contrastMatrix[rowIdx][colIdx]?.aaLarge" class="icon">⚡</span>
                    <span v-else class="icon">✗</span>
                    <span>{{ contrastMatrix[rowIdx][colIdx]?.level }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="colIdx === rowIdx">
                <!-- Диагональ (одинаковые цвета) -->
                <div class="same-color">
                  —
                </div>
              </template>
              <template v-else>
                <!-- Пустая ячейка (нижний треугольник) -->
                <div class="empty-cell"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно с деталями контраста -->
    <div v-if="showContrastModal" class="modal-overlay" @click.self="showContrastModal = false">
      <div class="modal-content">
        <h3>Детали контраста</h3>
        <div class="contrast-details">
          <div class="color-comparison">
            <div class="color-block" :style="{ backgroundColor: selectedContrast?.colorA }">
              <span>{{ selectedContrast?.colorA }}</span>
            </div>
            <div class="vs">↔</div>
            <div class="color-block" :style="{ 
              backgroundColor: selectedContrast?.colorB,
              color: contrastText(selectedContrast?.colorB)
            }">
              <span>{{ selectedContrast?.colorB }}</span>
            </div>
          </div>
          
          <div class="contrast-info">
            <div class="info-row">
              <span>Коэффициент контраста: </span>
              <strong>{{ selectedContrast?.ratio.toFixed(2) }}:1</strong>
            </div>
            <div class="info-row">
              <span>Уровень WCAG: </span>
              <span class="level-badge" :class="selectedContrast?.level.toLowerCase().replace(' ', '-')">
                {{ selectedContrast?.level }}
              </span>
            </div>
            <div class="info-row">
              <span>Соответствие AA: </span>
              <span :class="{ 'passed': selectedContrast?.aa, 'failed': !selectedContrast?.aa }">
                {{ selectedContrast?.aa ? '✅ Да' : '❌ Нет' }}
              </span>
            </div>
            <div class="info-row">
              <span>Соответствие AAA: </span>
              <span :class="{ 'passed': selectedContrast?.aaa, 'failed': !selectedContrast?.aaa }">
                {{ selectedContrast?.aaa ? '✅ Да' : '❌ Нет' }}
              </span>
            </div>
          </div>
        </div>
        <button class="btn" @click="showContrastModal = false">Закрыть</button>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import ControlsPanel from './ControlsPanel.vue'
import ColorCard from './ColorCard.vue'
import { 
  generateHarmony, 
  contrastRatio, 
  bestContrastText, 
  hexToHsl, 
  hslToHex, 
  clamp,
  getContrastDetails,
  analyzePalette,
  getPaletteAccessibilityScore
} from '../utils/colors'

const STORAGE_KEY = 'current_palette_v1'

export default {
  name: 'PaletteGenerator',
  components: { ControlsPanel, ColorCard },
  setup() {
    const count = ref(5)
    const format = ref('HEX')
    const baseColor = ref('#4e8cff')
    const paletteType = ref('analogous')
    const darkBg = ref(false)
    const pinMode = ref(false)
    const generationCount = ref(0)
    const canvasSize = ref(300)

    const palette = ref([])
    const pinned = ref({})
    const toast = ref('')
    const colorWheelCanvas = ref(null)
    const showContrastModal = ref(false)
    const selectedContrast = ref(null)

    function notify(msg){ 
      toast.value = msg; 
      setTimeout(() => toast.value = '', 1400) 
    }

    const displayColors = computed(() => {
      const out = []
      for(let i = 0; i < count.value; i++) {
        out.push(palette.value[i] ?? baseColor.value)
      }
      return out
    })

    const isMoodPalette = computed(() => {
      return ['calm', 'energetic', 'professional', 'romantic', 'nature'].includes(paletteType.value)
    })

    const moodInfo = computed(() => {
      const info = {
        calm: { desc: 'Спокойные тона' },
        energetic: { desc: 'Энергичные цвета' },
        professional: { desc: 'Профессиональная палитра' },
        romantic: { desc: 'Романтические оттенки' },
        nature: { desc: 'Природные цвета' },
        random: { desc: 'Случайная палитра' },
        analogous: { desc: 'Аналогичные цвета' },
        monochrome: { desc: 'Монохромная гамма' },
        triad: { desc: 'Триадные цвета' },
        complementary: { desc: 'Комплементарные цвета' }
      }
      return info[paletteType.value] || null
    })

    const contrastMatrix = computed(() => {
      const matrix = Array(count.value).fill().map(() => Array(count.value).fill(null))
      const colors = displayColors.value
      
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const contrast = getContrastDetails(colors[i], colors[j])
          matrix[i][j] = contrast
        }
      }
      
      return matrix
    })

    
    // Общая оценка доступности
    const accessibilityScore = computed(() => {
      return getPaletteAccessibilityScore(displayColors.value)
    })

    // CSS класс для уровня доступности
    const accessibilityLevelClass = computed(() => {
      const level = accessibilityScore.value.level.toLowerCase()
      if (level.includes('отлично')) return 'excellent'
      if (level.includes('хорошо')) return 'good'
      if (level.includes('удовлетворительно')) return 'fair'
      return 'poor'
    })

    // Класс для ячейки контраста
    function getContrastClass(contrast) {
      if (!contrast) return ''
      if (contrast.aaa) return 'contrast-aaa'
      if (contrast.aa) return 'contrast-aa'
      if (contrast.aaLarge) return 'contrast-aalarge'
      return 'contrast-insufficient'
    }

    function showContrastDetails(rowIdx, colIdx) {
      selectedContrast.value = {
        ...contrastMatrix.value[rowIdx][colIdx],
        colorA: displayColors.value[rowIdx],
        colorB: displayColors.value[colIdx]
      }
      showContrastModal.value = true
    }

    // Функция рисования цветового круга
    function drawColorWheel() {
      const canvas = colorWheelCanvas.value
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const center = canvasSize.value / 2
      const radius = center - 20
      
      // Очищаем канвас
      ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)
      
      // Рисуем цветовой круг
      for (let angle = 0; angle < 360; angle += 0.5) {
        const startAngle = (angle - 0.5) * Math.PI / 180
        const endAngle = (angle + 0.5) * Math.PI / 180
        
        // HSL: угол = hue, насыщенность = 100%, яркость = 50%
        const hue = angle
        const rgb = hslToRgb(hue, 100, 50)
        
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, startAngle, endAngle)
        ctx.closePath()
        
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        ctx.fill()
      }
      
      // Рисуем цвета палитры на круге
      const colors = displayColors.value
      colors.forEach((color, index) => {
        const hsl = hexToHsl(color)
        const angle = (hsl.h - 90) * Math.PI / 180 // -90 чтобы 0° был справа
        const pointRadius = 8
        const x = center + Math.cos(angle) * (radius * 0.8)
        const y = center + Math.sin(angle) * (radius * 0.8)
        
        // Точка цвета
        ctx.beginPath()
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Номер цвета
        ctx.fillStyle = bestContrastText(color)
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((index + 1).toString(), x, y)
      })
      
      // Центральная точка базового цвета
      const baseHsl = hexToHsl(baseColor.value)
      const baseAngle = (baseHsl.h - 90) * Math.PI / 180
      const baseX = center + Math.cos(baseAngle) * (radius * 0.4)
      const baseY = center + Math.sin(baseAngle) * (radius * 0.4)
      
      ctx.beginPath()
      ctx.arc(baseX, baseY, 6, 0, Math.PI * 2)
      ctx.fillStyle = baseColor.value
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

        function hslToRgb(h, s, l) {
      s /= 100
      l /= 100
      
      const c = (1 - Math.abs(2 * l - 1)) * s
      const x = c * (1 - Math.abs((h / 60) % 2 - 1))
      const m = l - c / 2
      
      let r, g, b
      
      if (h >= 0 && h < 60) {
        r = c; g = x; b = 0
      } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0
      } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x
      } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c
      } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c
      } else {
        r = c; g = 0; b = x
      }
      
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      }
    }

    function generate() {
      const isMoodType = isMoodPalette.value;
      let adjustedBase = baseColor.value;
      
      if (!isMoodType && paletteType.value !== 'random') {
        const baseHsl = hexToHsl(baseColor.value);
        const shift = generationCount.value * 8; // Сдвиг на 8° каждый раз
        adjustedBase = hslToHex(
          (baseHsl.h + shift) % 360,
          clamp(baseHsl.s + (Math.random() * 10 - 5), 10, 90),
          clamp(baseHsl.l + (Math.random() * 10 - 5), 10, 90)
        );
      }
      
      const newColors = generateHarmony(
        isMoodType ? '#000000' : adjustedBase,
        paletteType.value, 
        count.value
      )
      
      const variedColors = newColors.map((color, index) => {
        if (pinned.value[index]) {
          return palette.value[index] ?? color;
        }
        
        if (!isMoodType && Math.random() > 0.3) {
          const hsl = hexToHsl(color);
          return hslToHex(
            (hsl.h + Math.random() * 15 - 7.5 + 360) % 360,
            clamp(hsl.s + Math.random() * 10 - 5, 15, 85),
            clamp(hsl.l + Math.random() * 15 - 7.5, 15, 85)
          );
        }
        return color;
      });
      
      palette.value = variedColors;
      generationCount.value++;
      ensurePinnedLength();
      saveCurrent();
      
      nextTick(() => {
        drawColorWheel();
      });

      if (!isMoodType) {
        notify(`Палитра обновлена (генерация #${generationCount.value})`);
      }
    }

    // Функция "встряхивания" палитры
    function shufflePalette() {
      if (palette.value.length === 0) return;
      
      const newColors = palette.value.map((hex, index) => {
        if (pinned.value[index]) return hex;
        
        const hsl = hexToHsl(hex);
        return hslToHex(
          (hsl.h + Math.random() * 40 - 20 + 360) % 360,
          clamp(hsl.s + Math.random() * 20 - 10, 15, 85),
          clamp(hsl.l + Math.random() * 20 - 10, 15, 85)
        );
      });
      
      palette.value = newColors;
      notify('Палитра встряхнута!');
    }

    function onRandom(hex) {
      const isMoodType = isMoodPalette.value;
      
      if (isMoodType) {
        const types = ['random', 'analogous', 'monochrome', 'triad', 'complementary']
        paletteType.value = types[Math.floor(Math.random() * types.length)]
        notify('Переключен тип палитры');
      }
      
      if (typeof hex === 'string' && hex.match(/^#?[0-9A-Fa-f]{6}$/)) {
        const hh = hex.startsWith('#') ? hex.toUpperCase() : ('#' + hex.toUpperCase())
        baseColor.value = hh
      } else {
        const rnd = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6,'0').toUpperCase()
        baseColor.value = rnd
      }
      
      generationCount.value = 0; // Сбрасываем счётчик при новом случайном цвете
      generate()
    }

    function saveCurrent() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          colors: palette.value,
          count: count.value,
          base: baseColor.value,
          type: paletteType.value,
          isMood: isMoodPalette.value,
          generationCount: generationCount.value
        })
      )
    }

    function savePalette() {
      const name = prompt('Название палитры:')
      if (!name) return
      
      const tagsInput = prompt('Теги (через запятую, необязательно):\nПример: веб, интерфейс, тёмная тема')
      const tags = tagsInput 
        ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : []
      
      const raw = localStorage.getItem('palettes_v1')
      const arr = raw ? JSON.parse(raw) : []
      
      arr.unshift({ 
        id: Date.now(), 
        name, 
        colors: displayColors.value,
        type: paletteType.value,
        baseColor: baseColor.value,
        tags,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      localStorage.setItem('palettes_v1', JSON.stringify(arr))
      notify('Палитра сохранена с тегами')
    }

    function notifyCopy(hex) {
      notify('Скопировано: ' + hex)
    }

    function togglePin(i) {
      pinned.value[i] = !pinned.value[i]
      notify(pinned.value[i] ? 'Цвет закреплён' : 'Цвет откреплён')
    }

    function onColorClick(i) {
      if (pinMode.value) {
        togglePin(i)
      }
    }

    const pairs = computed(() => {
      const out = []
      const colors = displayColors.value
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const ratio = contrastRatio(colors[i], colors[j])
          let level = 'insufficient'
          if (ratio >= 7) level = 'AAA'
          else if (ratio >= 4.5) level = 'AA'
          else if (ratio >= 3) level = 'AA Large'
          out.push({ a: colors[i], b: colors[j], ratio, level })
        }
      }
      return out
    })

    function contrastText(hex) {
      return bestContrastText(hex)
    }

    function ensurePinnedLength() {
      Object.keys(pinned.value).forEach((k) => {
        const idx = Number(k)
        if (idx >= count.value) delete pinned.value[k]
      })
    }

    function loadPalette(paletteData) {
      if (!paletteData?.colors?.length) return
      
      palette.value = [...paletteData.colors]
      
      while (palette.value.length < count.value) {
        palette.value.push(baseColor.value)
      }
      
      pinned.value = {}
      
      notify('Палитра загружена')
      saveCurrent()
    }

    watch(count, (n) => {
      if (!Array.isArray(palette.value)) palette.value = []
      while (palette.value.length < n) palette.value.push(baseColor.value)
      if (palette.value.length > n) palette.value = palette.value.slice(0, n)
      ensurePinnedLength()
      saveCurrent()
    })

    watch(baseColor, () => {
      generationCount.value = 0; // Сбрасываем при изменении базового цвета
      saveCurrent()
    })

    watch(paletteType, (newType) => {
      generationCount.value = 0; // Сбрасываем при изменении типа
      if (['calm', 'energetic', 'professional', 'romantic', 'nature'].includes(newType)) {
        generate()
      }
      saveCurrent()
    })

    watch(displayColors, () => {
      nextTick(() => {
        drawColorWheel();
      });
    }, { deep: true })

    onMounted(() => {
      const raw = localStorage.getItem(STORAGE_KEY)

      if (raw) {
        try {
          const obj = JSON.parse(raw)
          palette.value = Array.isArray(obj.colors) ? obj.colors.slice() : generateHarmony(baseColor.value, 'random', count.value)
          baseColor.value = obj.base || baseColor.value
          paletteType.value = obj.type || paletteType.value
          generationCount.value = obj.generationCount || 0
        } catch {
          palette.value = generateHarmony(baseColor.value, 'random', count.value)
        }
      } else {
        palette.value = generateHarmony(baseColor.value, 'random', count.value)
      }

      if (!Array.isArray(palette.value)) palette.value = []
      while (palette.value.length < count.value) palette.value.push(baseColor.value)

      const handleLoadPalette = (event) => {
        loadPalette(event.detail)
      }
      
      window.addEventListener('load-palette', handleLoadPalette)
      
      nextTick(() => {
        drawColorWheel();
      });

      if (palette.value.length === 0 || palette.value.every(c => c === baseColor.value)) {
        generate();
      }

      window.addEventListener('resize', () => {
        const container = document.querySelector('.color-wheel-wrapper')
        if (container) {
          const size = Math.min(container.clientWidth, 400)
          canvasSize.value = size
          nextTick(() => {
            drawColorWheel()
          })
        }
      })
    })

    return {
      count,
      format,
      baseColor,
      paletteType,
      darkBg,
      pinMode,
      palette,
      pinned,
      generate,
      shufflePalette,
      notifyCopy,
      togglePin,
      onColorClick,
      displayColors,
      contrastText,
      toast,
      savePalette,
      onRandom,
      isMoodPalette,
      moodInfo,
      colorWheelCanvas,
      canvasSize,
      contrastMatrix,
      accessibilityScore,
      accessibilityLevelClass,
      getContrastClass,
      showContrastModal,
      selectedContrast,
      showContrastDetails
    }
  }
}
</script>

<style scoped>
.generator { 
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.controls-row {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 140px;
}

.btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.btn.primary {
  background: linear-gradient(90deg, #D251BC, #E76EB1);
  color: white;
  box-shadow: 0 8px 20px rgba(210, 81, 188, 0.2);
}

.btn.secondary {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  color: white;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
}

.btn:active {
  transform: translateY(0);
}

.preview-area {
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff, #fbfdff);
  border: 1px solid rgba(15, 42, 21, 0.03);
  box-shadow: 0 8px 22px rgba(15, 42, 21, 0.04);
}

.preview-area.dark {
  background: #0b1220;
  color: #e6eefb;
}

.palette-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.mockup {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.mockup h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.mockup .mock-btn {
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: transform 0.12s ease;
}

.mockup .mock-btn:hover {
  transform: scale(1.05);
}

.mockup .card {
  padding: 16px;
  border-radius: 12px;
  min-width: 240px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease;
}

.mockup .card:hover {
  transform: translateY(-4px);
}

.analysis {
  margin-top: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}

.analysis h3 {
  margin: 0 0 12px 0;
  color: var(--text);
}

.analysis ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.analysis li {
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 14px;
  color: var(--muted);
}

.analysis li:last-child {
  border-bottom: none;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  background: rgba(15, 23, 42, 0.95);
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.mood-info {
  padding: 12px;
  background: rgba(78, 140, 255, 0.1);
  border-radius: 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  border-left: 4px solid #4e8cff;
  animation: fadeIn 0.5s ease;
}

.preview-area.dark .mood-info {
  background: rgba(255, 255, 255, 0.1);
  border-left-color: #60a5fa;
  color: #e6eefb;
}

.small-muted {
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.small-muted input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.accessibility-badge {
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.accessibility-badge.excellent {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.accessibility-badge.good {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.accessibility-badge.fair {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.accessibility-badge.poor {
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: white;
}

.accessibility-badge .score {
  font-size: 18px;
  font-weight: 800;
}

.accessibility-badge .level {
  font-size: 12px;
  opacity: 0.9;
}

/* Цветовой круг */
.color-wheel-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-area.dark .color-wheel-container {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.color-wheel-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 20px;
  aspect-ratio: 1 / 1;
}

.color-wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.current-base {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.wheel-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-text {
  font-size: 12px;
  font-weight: 500;
}

/* Улучшенный анализ контрастности */
.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.wcag-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.wcag-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.wcag-badge.aaa {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.wcag-badge.aa {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.wcag-badge.aalarge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.wcag-badge.insufficient {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Таблица контрастности */
.contrast-grid {
  display: grid;
  grid-template-columns: 100px repeat(auto-fit, minmax(80px, 1fr));
  gap: 1px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.grid-header, .grid-row {
  display: contents;
}

.corner, .header-cell, .row-header, .grid-cell {
  background: white;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.preview-area.dark .corner,
.preview-area.dark .header-cell,
.preview-area.dark .row-header,
.preview-area.dark .grid-cell {
  background: #1e293b;
}

.header-cell {
  font-size: 12px;
  font-weight: 600;
}

.header-color {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  margin-bottom: 6px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.row-header {
  font-size: 12px;
  font-weight: 600;
}

.row-color {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  margin-bottom: 6px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.contrast-cell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.contrast-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.contrast-cell .ratio {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.contrast-cell .level {
  font-size: 10px;
  opacity: 0.8;
}

.contrast-aaa {
  background: rgba(16, 185, 129, 0.15);
  color: #065f46;
}

.preview-area.dark .contrast-aaa {
  background: rgba(16, 185, 129, 0.25);
  color: #a7f3d0;
}

.contrast-aa {
  background: rgba(59, 130, 246, 0.15);
  color: #1e40af;
}

.preview-area.dark .contrast-aa {
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
}

.contrast-aalarge {
  background: rgba(245, 158, 11, 0.15);
  color: #92400e;
}

.preview-area.dark .contrast-aalarge {
  background: rgba(245, 158, 11, 0.25);
  color: #fcd34d;
}

.contrast-insufficient {
  background: rgba(239, 68, 68, 0.15);
  color: #991b1b;
}

.preview-area.dark .contrast-insufficient {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.same-cell, .empty-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 12px;
}

/* Сводка доступности */
.accessibility-summary {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 15px;
}

.preview-area.dark .accessibility-summary {
  background: rgba(255, 255, 255, 0.05);
}

.summary-item {
  margin-bottom: 12px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}

.summary-item .value {
  float: right;
  font-weight: 700;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.preview-area.dark .modal-content {
  background: #1e293b;
  color: #e6eefb;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.contrast-details {
  margin: 20px 0;
}

.color-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.color-block {
  flex: 1;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-family: monospace;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vs {
  font-size: 24px;
  font-weight: bold;
  color: var(--muted);
}

.contrast-info {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 15px;
}

.preview-area.dark .contrast-info {
  background: rgba(255, 255, 255, 0.05);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-area.dark .info-row {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.level-badge.aaa {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.level-badge.aa {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.level-badge.aa-large {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.level-badge.недостаточно {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.passed {
  color: #10b981;
  font-weight: 600;
}

.failed {
  color: #ef4444;
  font-weight: 600;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .controls-row {
    flex-direction: column;
  }
  
  .palette-row {
    justify-content: center;
  }
  
  .mockup {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mockup .card {
    min-width: 100%;
  }
  
  .color-card {
    width: 48%;
    height: 110px;
  }
  
  .btn {
    width: 100%;
  }

  .color-wheel-wrapper {
    max-width: 300px;
  }
  
  .contrast-grid {
    grid-template-columns: 80px repeat(auto-fit, minmax(70px, 1fr));
  }
  
  .header-cell, .row-header {
    font-size: 11px;
    padding: 8px 4px;
  }
  
  .contrast-cell .ratio {
    font-size: 12px;
  }
  
  .contrast-cell .level {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .palette-row {
    gap: 8px;
  }
  
  .mockup h2 {
    font-size: 18px;
  }
  
  .analysis {
    padding: 12px;
  }
  
  .analysis li {
    font-size: 12px;
  }

  .color-wheel-wrapper {
    max-width: 250px;
  }
  
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .wcag-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .wcag-badge {
    flex: 1;
    text-align: center;
  }
}


/* Контейнер анализа */
.analysis {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.preview-area.dark .analysis {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.analysis-header h3 {
  margin: 0 0 8px 0;
  color: var(--text);
  font-size: 20px;
}

.analysis-subtitle {
  margin: 0 0 20px 0;
  color: var(--muted);
  font-size: 14px;
}

/* Легенда контрастности */
.contrast-legend {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}

.preview-area.dark .contrast-legend {
  background: rgba(255, 255, 255, 0.05);
}

.legend-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.legend-color.excellent {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.legend-color.good {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.legend-color.warning {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.legend-color.poor {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

.legend-text {
  flex: 1;
}

.legend-text strong {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.legend-text small {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

/* Матрица контрастности */
.contrast-matrix {
  margin: 24px 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.preview-area.dark .contrast-matrix {
  border-color: rgba(255, 255, 255, 0.1);
}

.matrix-title {
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-area.dark .matrix-title {
  background: rgba(255, 255, 255, 0.05);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.matrix-header {
  display: grid;
  grid-template-columns: 120px repeat(auto-fit, minmax(100px, 1fr));
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-area.dark .matrix-header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.header-corner {
  padding: 16px;
}

.color-header {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.color-sample {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.color-label {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.matrix-row {
  display: grid;
  grid-template-columns: 120px repeat(auto-fit, minmax(100px, 1fr));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-area.dark .matrix-row {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.matrix-row:last-child {
  border-bottom: none;
}

.row-header {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.01);
}

.preview-area.dark .row-header {
  background: rgba(255, 255, 255, 0.03);
}

.matrix-cell {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90px;
}

.contrast-info {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.contrast-info:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.contrast-info.excellent {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1));
  border: 2px solid rgba(16, 185, 129, 0.3);
  color: #065f46;
}

.preview-area.dark .contrast-info.excellent {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2));
  border-color: rgba(16, 185, 129, 0.4);
  color: #a7f3d0;
}

.contrast-info.good {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1));
  border: 2px solid rgba(59, 130, 246, 0.3);
  color: #1e40af;
}

.preview-area.dark .contrast-info.good {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.2));
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.contrast-info.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1));
  border: 2px solid rgba(245, 158, 11, 0.3);
  color: #92400e;
}

.preview-area.dark .contrast-info.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
  border-color: rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

.contrast-info.poor {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1));
  border: 2px solid rgba(239, 68, 68, 0.3);
  color: #991b1b;
}

.preview-area.dark .contrast-info.poor {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2));
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.contrast-ratio {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.contrast-level {
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.contrast-level .icon {
  font-size: 12px;
}

.same-color {
  color: var(--muted);
  font-size: 18px;
  font-weight: 300;
}
/* Адаптивность */
@media (max-width: 768px) {
  .matrix-header,
  .matrix-row {
    grid-template-columns: 80px repeat(auto-fit, minmax(80px, 1fr));
  }
  
  .color-header,
  .row-header {
    padding: 12px 8px;
  }
  
  .color-sample {
    width: 30px;
    height: 30px;
  }
  
  .color-label {
    font-size: 10px;
  }
  
  .contrast-ratio {
    font-size: 16px;
  }
  
  .contrast-level {
    font-size: 10px;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
}

</style>