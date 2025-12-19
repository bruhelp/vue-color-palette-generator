<template>
  <div class="saved section">
    <div class="saved-header">
      <h2>Библиотека палитр</h2>
      
      <!-- Поиск и фильтры -->
      <div class="controls">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Поиск по названию или тегам..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            :class="{ active: activeFilter === 'all' }"
            @click="setFilter('all')"
          >
            Все палитры
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: activeFilter === 'favorites' }"
            @click="setFilter('favorites')"
          >
            ❤️ Избранные
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: activeFilter === 'recent' }"
            @click="setFilter('recent')"
          >
            🕒 Недавние
          </button>
        </div>
        
        <div class="sort-controls">
          <label>Сортировка:</label>
          <select v-model="sortBy" class="sort-select">
            <option value="date">По дате (новые)</option>
            <option value="name">По названию</option>
            <option value="colors">По количеству цветов</option>
            <option value="favorites">По популярности</option>
          </select>
        </div>
      </div>
      
      <div class="stats" v-if="filteredPalettes.length > 0">
        <span class="stat-item">Всего: {{ saved.length }}</span>
        <span class="stat-item">Избранных: {{ favoriteCount }}</span>
        <span class="stat-item">Показано: {{ filteredPalettes.length }}</span>
      </div>
    </div>
    
    <!-- Сообщение если нет результатов -->
    <div v-if="filteredPalettes.length === 0" class="empty-state">
      <div class="empty-icon">🎨</div>
      <h3>Палитры не найдены</h3>
      <p v-if="activeFilter === 'favorites'">
        У вас пока нет избранных палитр. Нажмите на сердечко ❤️ у любой палитры, чтобы добавить её в избранное.
      </p>
      <p v-else-if="searchQuery">
        По запросу "{{ searchQuery }}" ничего не найдено. Попробуйте изменить поисковый запрос.
      </p>
      <p v-else>
        У вас пока нет сохранённых палитр. Создайте палитру в генераторе и сохраните её!
      </p>
      <button class="btn primary" @click="goToGenerator" v-if="saved.length === 0">
        Перейти к генератору
      </button>
    </div>
    
    <!-- Список палитр -->
    <div class="saved-grid" v-else>
      <div 
        v-for="p in filteredPalettes" 
        :key="p.id" 
        class="saved-card"
        :class="{ 'favorite': p.favorite }"
      >
        <div class="card-header">
          <div class="card-tags" v-if="p.tags && p.tags.length > 0">
            <span class="tag" v-for="tag in p.tags.slice(0, 3)" :key="tag">#{{ tag }}</span>
            <span class="tag-more" v-if="p.tags.length > 3">+{{ p.tags.length - 3 }}</span>
          </div>
          
          <div class="card-actions">
            <button 
              class="action-btn"
              @click="sharePalette(p)"
              :title="'Поделиться'"
            >
              🔗
            </button>
            <button 
              class="action-btn"
              @click="toggleFavorite(p.id)"
              :title="p.favorite ? 'Удалить из избранного' : 'Добавить в избранное'"
            >
              {{ p.favorite ? '❤️' : '🤍' }}
            </button>
          </div>
        </div>
        
        <div class="preview-wrapper">
          <!-- Переключатель между цветами и превью -->
          <div class="preview-tabs">
            <button 
              class="preview-tab" 
              :class="{ active: p.activeTab === 'colors' }"
              @click="setPreviewTab(p.id, 'colors')"
            >
              Цвета
            </button>
            <button 
              class="preview-tab" 
              :class="{ active: p.activeTab === 'ui' }"
              @click="setPreviewTab(p.id, 'ui')"
            >
              UI Превью
            </button>
          </div>
          
          <!-- Превью цветов -->
          <div 
            v-if="getPaletteTab(p.id) === 'colors'"
            class="preview" 
            :style="{ background: toGradient(p.colors) }"
            @click="load(p)"
          ></div>
          
          <!-- Превью UI-компонентов -->
          <div v-else class="ui-preview">
            <div class="ui-preview-content">
              <!-- Кнопки -->
              <div class="ui-section">
                <button class="ui-btn primary" :style="{ backgroundColor: p.colors[0] || '#4e8cff' }">
                  Primary Button
                </button>
                <button class="ui-btn secondary" :style="{ 
                  backgroundColor: p.colors[1] || '#f0f5ff',
                  color: p.colors[0] || '#4e8cff',
                  borderColor: p.colors[0] || '#4e8cff'
                }">
                  Secondary Button
                </button>
                <button class="ui-btn ghost" :style="{ 
                  color: p.colors[0] || '#4e8cff'
                }">
                  Ghost Button
                </button>
              </div>
              
              <!-- Карточка -->
              <div class="ui-card" :style="{ 
                borderColor: p.colors[2] || '#e5e7eb',
                backgroundColor: p.colors[3] || '#f9fafb'
              }">
                <h4 :style="{ color: p.colors[0] || '#4e8cff' }">UI Card Title</h4>
                <p :style="{ color: p.colors[1] || '#64748b' }">
                  This is a preview card using your palette colors
                </p>
              </div>
              
              <!-- Навигация -->
              <div class="ui-nav" :style="{ 
                backgroundColor: p.colors[4] || '#ffffff',
                borderColor: p.colors[2] || '#e5e7eb'
              }">
                <span :style="{ color: p.colors[0] || '#4e8cff' }">Home</span>
                <span :style="{ color: p.colors[1] || '#64748b' }">About</span>
                <span :style="{ color: p.colors[1] || '#64748b' }">Services</span>
                <span :style="{ color: p.colors[1] || '#64748b' }">Contact</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="meta">
          <h3 class="name">{{ p.name }}</h3>
          
          <div class="meta-details">
            <span class="detail">
              <span class="detail-icon">🎨</span>
              {{ p.colors.length }} цветов
            </span>
            <span class="detail">
              <span class="detail-icon">📅</span>
              {{ formatDate(p.createdAt) }}
            </span>
            <span class="detail" v-if="p.type">
              <span class="detail-icon">✨</span>
              {{ getTypeName(p.type) }}
            </span>
          </div>
          
          <div class="colors">
            <span 
              v-for="(c, idx) in p.colors" 
              :key="c" 
              class="dot" 
              :style="{ backgroundColor: c }" 
              :title="c"
              @click="copyColor(c)"
            >
              <span class="dot-number">{{ idx + 1 }}</span>
            </span>
          </div>
          
          <div class="buttons">
            <button @click="load(p)" class="btn primary">
              <span class="btn-icon">↻</span>
              Загрузить
            </button>
            <button @click="exportPalette(p)" class="btn">
              <span class="btn-icon">📤</span>
              Экспорт
            </button>
            <button @click="editPalette(p)" class="btn">
              <span class="btn-icon">✏️</span>
              Изменить
            </button>
            <button @click="confirmDelete(p.id)" class="btn ghost">
              <span class="btn-icon">🗑️</span>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно экспорта -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-content export-modal">
        <h3>Экспорт палитры: {{ exportPaletteData?.name }}</h3>
        
        <div class="export-tabs">
          <button 
            v-for="format in exportFormats" 
            :key="format.value"
            class="export-tab"
            :class="{ active: exportFormat === format.value }"
            @click="exportFormat = format.value"
          >
            {{ format.label }}
          </button>
        </div>
        
        <div class="export-preview">
          <pre class="code-block"><code>{{ generatedCode }}</code></pre>
          <div class="export-actions">
            <button @click="copyGeneratedCode" class="btn primary">
              <span class="btn-icon">📋</span>
              Копировать
            </button>
            <button @click="downloadGeneratedCode" class="btn">
              <span class="btn-icon">💾</span>
              Скачать файл
            </button>
          </div>
        </div>
        
        <div class="form-actions">
          <button @click="closeExportModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно шаринга -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
      <div class="modal-content share-modal">
        <h3>Поделиться палитрой: {{ sharePaletteData?.name }}</h3>
        
        <div class="share-url">
          <input 
            type="text" 
            :value="shareUrl" 
            readonly 
            class="share-input"
            ref="shareInput"
          >
          <button @click="copyShareUrl" class="btn primary">
            Копировать
          </button>
        </div>
        
        <div class="share-options">
          <div class="share-option">
            <h4>QR-код для мобильных</h4>
            <div class="qrcode-placeholder">
              <div class="qrcode">
                <div class="qrcode-grid">
                  <!-- Простая имитация QR-кода -->
                  <div v-for="i in 25" :key="i" class="qrcode-cell" :class="{ black: Math.random() > 0.5 }"></div>
                </div>
              </div>
              <p>Отсканируйте код для быстрого доступа</p>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button @click="closeShareModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно редактирования -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Редактирование палитры</h3>
        
        <div class="form-group">
          <label>Название палитры</label>
          <input 
            type="text" 
            v-model="editForm.name" 
            class="form-input"
            placeholder="Введите название..."
          >
        </div>
        
        <div class="form-group">
          <label>Теги (через запятую)</label>
          <input 
            type="text" 
            v-model="editForm.tagsString" 
            class="form-input"
            placeholder="веб, интерфейс, тёмная тема..."
          >
          <small>Теги помогут быстрее находить палитры</small>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="editForm.favorite">
            Добавить в избранное
          </label>
        </div>
        
        <div class="form-actions">
          <button @click="saveEdit" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn">Отмена</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <h3>Удалить палитру?</h3>
        <p>Вы уверены, что хотите удалить палитру "{{ paletteToDelete?.name }}"?</p>
        <div class="modal-actions">
          <button @click="deletePalette" class="btn danger">Да, удалить</button>
          <button @click="cancelDelete" class="btn">Отмена</button>
        </div>
      </div>
    </div>
    
    <!-- Toast уведомление -->
    <div v-if="toast.message" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'palettes_v1'
const SHARE_STORAGE_KEY = 'palette_shares_v1'

export default {
  name: 'SavedPalettesView',
  setup() {
    const router = useRouter()
    const saved = ref([])
    const searchQuery = ref('')
    const activeFilter = ref('all')
    const sortBy = ref('date')
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showExportModal = ref(false)
    const showShareModal = ref(false)
    const paletteToDelete = ref(null)
    const exportPaletteData = ref(null)
    const sharePaletteData = ref(null)
    const exportFormat = ref('css')
    
    const editForm = ref({
      id: null,
      name: '',
      tagsString: '',
      favorite: false
    })
    
    const toast = ref({
      message: '',
      type: 'info'
    })
    
    const exportFormats = [
      { value: 'css', label: 'CSS Variables' },
      { value: 'scss', label: 'SCSS Variables' },
      { value: 'tailwind', label: 'Tailwind Config' },
      { value: 'cssClasses', label: 'CSS Classes' }
    ]
    
    // Статистика шаринга
    const shareStats = ref({
      views: 0
    })
    
    // Ссылка для шаринга
    const shareUrl = computed(() => {
      if (!sharePaletteData.value) return ''
      const baseUrl = window.location.origin
      return `${baseUrl}/palette/${sharePaletteData.value.id}`
    })
    
    function showToast(message, type = 'info') {
      toast.value = { message, type }
      setTimeout(() => {
        toast.value.message = ''
      }, 3000)
    }
    
    function loadSaved() {
      const raw = localStorage.getItem(STORAGE_KEY)
      saved.value = raw ? JSON.parse(raw) : []
      
      // Инициализируем активные вкладки для превью
      saved.value.forEach(p => {
        if (!p.activeTab) {
          p.activeTab = 'colors'
        }
      })
    }
    
    onMounted(() => {
      loadSaved()
    })
    
    const favoriteCount = computed(() => {
      return saved.value.filter(p => p.favorite).length
    })
    
    // Сгенерированный код для экспорта
    const generatedCode = computed(() => {
      if (!exportPaletteData.value) return ''
      
      const colors = exportPaletteData.value.colors
      const name = exportPaletteData.value.name
      
      switch (exportFormat.value) {
        case 'css':
          return generateCSSVariables(colors, name)
        case 'scss':
          return generateSCSSVariables(colors, name)
        case 'tailwind':
          return generateTailwindConfig(colors, name)
        case 'cssClasses':
          return generateCSSClasses(colors, name)
        default:
          return ''
      }
    })
    
    function generateCSSVariables(colors, name) {
      const comment = `/* ${name} - CSS Variables */\n`
      const root = `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`
      const usage = `\n\n/* Пример использования: */\n/* .element { color: var(--color-1); } */`
      return comment + root + usage
    }
    
    function generateSCSSVariables(colors, name) {
      const comment = `// ${name} - SCSS Variables\n`
      const vars = colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n')
      const usage = `\n\n// Пример использования:\n// .element { color: $color-1; }`
      return comment + vars + usage
    }
    
    function generateTailwindConfig(colors, name) {
      const comment = `// ${name} - Tailwind CSS Config\n`
      const colorsConfig = colors.reduce((acc, c, i) => {
        acc[`color-${i + 1}`] = c
        return acc
      }, {})
      
      const config = `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorsConfig, null, 2).replace(/"/g, "'")}
    }
  }
}`
      
      return comment + config
    }
    
    function generateCSSClasses(colors, name) {
      const comment = `/* ${name} - CSS Color Classes */\n`
      const classes = colors.map((c, i) => 
        `.color-${i + 1} { color: ${c}; }\n.bg-color-${i + 1} { background-color: ${c}; }`
      ).join('\n')
      return comment + classes
    }
    
    // Установка активной вкладки превью для палитры
    function setPreviewTab(paletteId, tab) {
      const index = saved.value.findIndex(p => p.id === paletteId)
      if (index !== -1) {
        saved.value[index].activeTab = tab
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value))
      }
    }
    
    function getPaletteTab(paletteId) {
      const palette = saved.value.find(p => p.id === paletteId)
      return palette?.activeTab || 'colors'
    }
    
    // Отфильтрованные палитры
    const filteredPalettes = computed(() => {
      let result = [...saved.value]
      
      // Фильтрация
      if (activeFilter.value === 'favorites') {
        result = result.filter(p => p.favorite)
      } else if (activeFilter.value === 'recent') {
        // Последние 30 дней
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        result = result.filter(p => new Date(p.createdAt) > thirtyDaysAgo)
      }
      
      // Поиск
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(p => {
          const nameMatch = p.name.toLowerCase().includes(query)
          const tagsMatch = p.tags?.some(tag => 
            tag.toLowerCase().includes(query)
          )
          const colorsMatch = p.colors.some(color =>
            color.toLowerCase().includes(query)
          )
          return nameMatch || tagsMatch || colorsMatch
        })
      }
      
      // Сортировка
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'colors':
            return b.colors.length - a.colors.length
          case 'favorites':
            // Сначала избранные, потом по дате
            if (a.favorite && !b.favorite) return -1
            if (!a.favorite && b.favorite) return 1
            return new Date(b.createdAt) - new Date(a.createdAt)
          case 'date':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt)
        }
      })
      
      return result
    })
    
    const toGradient = (colors) => `linear-gradient(90deg, ${colors.join(',')})`
    
    function formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return 'Вчера'
      if (diffDays === 0) return 'Сегодня'
      if (diffDays < 7) return `${diffDays} дней назад`
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      })
    }
    
    function getTypeName(type) {
      const types = {
        calm: 'Спокойная',
        energetic: 'Энергичная',
        professional: 'Профессиональная',
        romantic: 'Романтическая',
        nature: 'Природная',
        analogous: 'Аналогичная',
        monochrome: 'Монохромная',
        triad: 'Триада',
        complementary: 'Комплементарная',
        random: 'Случайная'
      }
      return types[type] || type
    }
    
    function setFilter(filter) {
      activeFilter.value = filter
    }
    
    function goToGenerator() {
      router.push('/')
    }
    
    function toggleFavorite(id) {
      const index = saved.value.findIndex(p => p.id === id)
      if (index !== -1) {
        saved.value[index].favorite = !saved.value[index].favorite
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value))
        showToast(
          saved.value[index].favorite 
            ? 'Добавлено в избранное' 
            : 'Удалено из избранного',
          'success'
        )
      }
    }
    
    function load(p) {
      window.dispatchEvent(new CustomEvent('load-palette', { 
        detail: {
          ...p,
          colors: [...p.colors]
        }
      }))
      router.push('/')
      showToast(`Палитра "${p.name}" загружена в генератор`, 'success')
    }
    
    function copyColor(color) {
      navigator.clipboard.writeText(color)
      showToast(`Цвет ${color} скопирован`, 'info')
    }
    
    // Экспорт палитры
    function exportPalette(p) {
      exportPaletteData.value = p
      showExportModal.value = true
    }
    
    function closeExportModal() {
      showExportModal.value = false
      exportPaletteData.value = null
    }
    
    function copyGeneratedCode() {
      navigator.clipboard.writeText(generatedCode.value)
      showToast('Код скопирован в буфер обмена', 'success')
    }
    
    function downloadGeneratedCode() {
      const format = exportFormat.value
      const ext = format === 'tailwind' ? 'js' : format === 'scss' ? 'scss' : 'css'
      const filename = `${exportPaletteData.value.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`
      
      const blob = new Blob([generatedCode.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast(`Файл ${filename} скачан`, 'success')
    }
    
    // Шаринг палитры
    function sharePalette(p) {
      sharePaletteData.value = p
      
      // Загружаем статистику
      const shares = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '{}')
      if (shares[p.id]) {
        shareStats.value = shares[p.id]
      } else {
        shareStats.value = { views: 0 }
      }
      
      showShareModal.value = true
    }
    
    function closeShareModal() {
      showShareModal.value = false
      sharePaletteData.value = null
      shareStats.value = { views: 0 }
    }
    
    function copyShareUrl() {
      navigator.clipboard.writeText(shareUrl.value)
      showToast('Ссылка скопирована в буфер обмена', 'success')
    }
    
    function editPalette(p) {
      editForm.value = {
        id: p.id,
        name: p.name,
        tagsString: p.tags ? p.tags.join(', ') : '',
        favorite: p.favorite || false
      }
      showEditModal.value = true
    }
    
    function closeModal() {
      showEditModal.value = false
      editForm.value = {
        id: null,
        name: '',
        tagsString: '',
        favorite: false
      }
    }
    
    function saveEdit() {
      const index = saved.value.findIndex(p => p.id === editForm.value.id)
      if (index !== -1) {
        saved.value[index] = {
          ...saved.value[index],
          name: editForm.value.name,
          tags: editForm.value.tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
          favorite: editForm.value.favorite,
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value))
        showToast('Палитра обновлена', 'success')
        closeModal()
      }
    }
    
    function confirmDelete(id) {
      const palette = saved.value.find(p => p.id === id)
      if (palette) {
        paletteToDelete.value = palette
        showDeleteModal.value = true
      }
    }
    
    function cancelDelete() {
      paletteToDelete.value = null
      showDeleteModal.value = false
    }
    
    function deletePalette() {
      if (paletteToDelete.value) {
        saved.value = saved.value.filter(p => p.id !== paletteToDelete.value.id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value))
        showToast(`Палитра "${paletteToDelete.value.name}" удалена`, 'success')
        cancelDelete()
      }
    }
    
    return {
      saved,
      searchQuery,
      activeFilter,
      sortBy,
      showEditModal,
      showDeleteModal,
      showExportModal,
      showShareModal,
      paletteToDelete,
      exportPaletteData,
      sharePaletteData,
      editForm,
      toast,
      exportFormat,
      exportFormats,
      generatedCode,
      shareUrl,
      shareStats,
      filteredPalettes,
      favoriteCount,
      toGradient,
      formatDate,
      getTypeName,
      setFilter,
      goToGenerator,
      toggleFavorite,
      load,
      copyColor,
      exportPalette,
      closeExportModal,
      copyGeneratedCode,
      downloadGeneratedCode,
      sharePalette,
      closeShareModal,
      copyShareUrl,
      editPalette,
      closeModal,
      saveEdit,
      confirmDelete,
      cancelDelete,
      deletePalette,
      setPreviewTab,
      getPaletteTab,
      showToast
    }
  }
}
</script>

<style scoped>
.saved {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.saved-header {
  margin-bottom: 30px;
}

.saved-header h2 {
  margin: 0 0 20px 0;
  font-size: 28px;
  color: var(--text);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(78, 140, 255, 0.1);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(0, 0, 0, 0.02);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-controls label {
  font-size: 14px;
  color: var(--muted);
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--muted);
}

.stat-item {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: var(--text);
}

.empty-state p {
  margin: 0 0 24px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.saved-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.saved-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
}

.saved-card.favorite {
  border: 2px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px 0;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  color: var(--muted);
}

.tag-more {
  font-size: 11px;
  color: var(--muted);
}

.preview-wrapper {
  position: relative;
}

.preview-tabs {
  display: flex;
  padding: 8px 8px 0 8px;
}

.preview-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-tab:first-child {
  border-radius: 6px 0 0 0;
}

.preview-tab:last-child {
  border-radius: 0 6px 0 0;
}

.preview-tab.active {
  background: white;
  color: var(--text);
  font-weight: 600;
}

.preview {
  height: 120px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  margin: 0 8px 8px 8px;
  border-radius: 0 0 8px 8px;
}

.preview:hover {
  opacity: 0.9;
}

.ui-preview {
  height: 120px;
  margin: 0 8px 8px 8px;
  border-radius: 0 0 8px 8px;
  background: white;
  overflow: hidden;
}

.ui-preview-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
}

.ui-section {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ui-btn {
  padding: 4px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 10px;
  cursor: default;
  white-space: nowrap;
}

.ui-btn.primary {
  border-color: transparent;
  color: white;
}

.ui-btn.secondary {
  background-color: transparent;
}

.ui-btn.ghost {
  background: transparent;
  border-color: transparent;
}

.ui-card {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid;
}

.ui-card h4 {
  margin: 0 0 4px 0;
  font-size: 11px;
  font-weight: 600;
}

.ui-card p {
  margin: 0;
  font-size: 9px;
  line-height: 1.3;
}

.ui-nav {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid;
}

.ui-nav span {
  font-size: 10px;
  font-weight: 500;
  cursor: default;
}

.meta {
  padding: 16px;
}

.name {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.meta-details {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--muted);
}

.detail {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-icon {
  font-size: 14px;
}

.colors {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.dot {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.dot:hover {
  transform: scale(1.1);
  z-index: 1;
}

.dot-number {
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn.primary {
  background: var(--accent);
  color: white;
  flex: 1;
}

.btn.ghost {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text);
}

.btn.danger {
  background: #ef4444;
  color: white;
}

.btn-icon {
  font-size: 14px;
}

/* Модальные окна */
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

.export-modal,
.share-modal {
  max-width: 600px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
}

/* Экспорт вкладки */
.export-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.export-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.export-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.export-preview {
  margin-bottom: 20px;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.code-block code {
  color: #333;
}

.export-actions {
  display: flex;
  gap: 12px;
}

/* Шаринг модалка */
.share-url {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.share-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: #f8f9fa;
}

.share-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.qrcode-placeholder {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.qrcode {
  display: inline-block;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
}

.qrcode-grid {
  display: grid;
  grid-template-columns: repeat(5, 12px);
  grid-template-rows: repeat(5, 12px);
  gap: 1px;
}

.qrcode-cell {
  width: 12px;
  height: 12px;
  background: white;
}

.qrcode-cell.black {
  background: #333;
}

.qrcode-placeholder p {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--muted);
}

.share-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 13px;
  color: var(--muted);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* Формы */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-weight: 600;
  z-index: 1001;
  animation: slideInRight 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.info {
  background: var(--accent);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .saved {
    padding: 16px;
  }
  
  .saved-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .sort-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .share-options {
    grid-template-columns: 1fr;
  }
  
  .buttons {
    flex-wrap: wrap;
  }
  
  .btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>