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
              @click="toggleFavorite(p.id)"
              :title="p.favorite ? 'Удалить из избранного' : 'Добавить в избранное'"
            >
              {{ p.favorite ? '❤️' : '🤍' }}
            </button>
            <button 
              class="action-btn"
              @click="showExportModal(p)"
              title="Экспорт палитры"
            >
              📤
            </button>
            <button 
              class="action-btn"
              @click="showShareModal(p)"
              title="Поделиться"
            >
              🔗
            </button>
          </div>
        </div>
        
        <div 
          class="preview" 
          :style="{ background: toGradient(p.colors) }"
          @click="showPreviewModal(p)"
        >
          <div class="preview-overlay">
            <span class="preview-text">Нажмите для превью</span>
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
            <button @click="showCssModal(p)" class="btn">
              <span class="btn-icon">💻</span>
              CSS
            </button>
            <button @click="editPalette(p)" class="btn">
              <span class="btn-icon">✏️</span>
              Изменить
            </button>
            <button @click="confirmDelete(p.id)" class="btn ghost">
              <span class="btn-icon">🗑️</span>
            </button>
          </div>
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
    
    <!-- Модальное окно экспорта -->
    <div v-if="showExportModalFlag" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-content wide">
        <h3>Экспорт палитры "{{ exportPalette?.name }}"</h3>
        
        <div class="export-tabs">
          <button 
            v-for="tab in exportTabs" 
            :key="tab.id"
            class="export-tab"
            :class="{ active: activeExportTab === tab.id }"
            @click="activeExportTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <div class="export-content">
          <!-- CSS Variables -->
          <div v-if="activeExportTab === 'css'" class="export-section">
            <h4>CSS Variables</h4>
            <pre class="code-block"><code>{{ generateCssVariables() }}</code></pre>
            <button @click="copyToClipboard(generateCssVariables())" class="btn primary">
              📋 Скопировать CSS
            </button>
          </div>
          
          <!-- SCSS Variables -->
          <div v-if="activeExportTab === 'scss'" class="export-section">
            <h4>SCSS Variables</h4>
            <pre class="code-block"><code>{{ generateScssVariables() }}</code></pre>
            <button @click="copyToClipboard(generateScssVariables())" class="btn primary">
              📋 Скопировать SCSS
            </button>
          </div>
          
          <!-- Tailwind Config -->
          <div v-if="activeExportTab === 'tailwind'" class="export-section">
            <h4>Tailwind CSS Config</h4>
            <pre class="code-block"><code>{{ generateTailwindConfig() }}</code></pre>
            <button @click="copyToClipboard(generateTailwindConfig())" class="btn primary">
              📋 Скопировать Config
            </button>
          </div>
          
          <!-- JSON -->
          <div v-if="activeExportTab === 'json'" class="export-section">
            <h4>JSON</h4>
            <pre class="code-block"><code>{{ generateJsonExport() }}</code></pre>
            <button @click="copyToClipboard(generateJsonExport())" class="btn primary">
              📋 Скопировать JSON
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeExportModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно CSS кода -->
    <div v-if="showCssModalFlag" class="modal-overlay" @click.self="closeCssModal">
      <div class="modal-content wide">
        <h3>Готовый CSS код для "{{ cssPalette?.name }}"</h3>
        
        <div class="css-tabs">
          <button 
            v-for="tab in cssTabs" 
            :key="tab.id"
            class="css-tab"
            :class="{ active: activeCssTab === tab.id }"
            @click="activeCssTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <div class="css-content">
          <!-- Базовые классы -->
          <div v-if="activeCssTab === 'classes'" class="css-section">
            <h4>CSS классы для цветов</h4>
            <pre class="code-block"><code>{{ generateCssClasses() }}</code></pre>
            <button @click="copyToClipboard(generateCssClasses())" class="btn primary">
              📋 Скопировать классы
            </button>
          </div>
          
          <!-- Утилитарные классы -->
          <div v-if="activeCssTab === 'utilities'" class="css-section">
            <h4>Утилитарные CSS классы</h4>
            <pre class="code-block"><code>{{ generateUtilityClasses() }}</code></pre>
            <button @click="copyToClipboard(generateUtilityClasses())" class="btn primary">
              📋 Скопировать утилиты
            </button>
          </div>
          
          <!-- Темы -->
          <div v-if="activeCssTab === 'themes'" class="css-section">
            <h4>CSS для светлой/тёмной темы</h4>
            <pre class="code-block"><code>{{ generateThemeCss() }}</code></pre>
            <button @click="copyToClipboard(generateThemeCss())" class="btn primary">
              📋 Скопировать темы
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeCssModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно превью UI -->
    <div v-if="showPreviewModalFlag" class="modal-overlay" @click.self="closePreviewModal">
      <div class="modal-content extra-wide">
        <h3>UI Превью: "{{ previewPalette?.name }}"</h3>
        
        <div class="ui-preview">
          <!-- Панель управления превью -->
          <div class="preview-controls">
            <div class="preview-theme">
              <button 
                class="theme-btn" 
                :class="{ active: previewTheme === 'light' }"
                @click="previewTheme = 'light'"
              >
                ☀️ Светлая
              </button>
              <button 
                class="theme-btn" 
                :class="{ active: previewTheme === 'dark' }"
                @click="previewTheme = 'dark'"
              >
                🌙 Тёмная
              </button>
            </div>
            <div class="preview-layout">
              <button 
                class="layout-btn" 
                :class="{ active: previewLayout === 'desktop' }"
                @click="previewLayout = 'desktop'"
              >
                🖥️ Десктоп
              </button>
              <button 
                class="layout-btn" 
                :class="{ active: previewLayout === 'mobile' }"
                @click="previewLayout = 'mobile'"
              >
                📱 Мобильный
              </button>
            </div>
          </div>
          
          <!-- Основное превью -->
          <div class="preview-container" :class="[previewTheme, previewLayout]">
            <!-- Шапка -->
            <div class="ui-header" :style="{ backgroundColor: previewPalette?.colors[0] }">
              <div class="header-content">
                <div class="logo" :style="{ color: getContrastColor(previewPalette?.colors[0]) }">
                  🎨 Brand
                </div>
                <nav class="nav">
                  <a href="#" class="nav-link" :style="{ color: getContrastColor(previewPalette?.colors[0]) }">Главная</a>
                  <a href="#" class="nav-link" :style="{ color: getContrastColor(previewPalette?.colors[0]) }">О нас</a>
                  <a href="#" class="nav-link" :style="{ color: getContrastColor(previewPalette?.colors[0]) }">Контакты</a>
                </nav>
                <button class="ui-btn primary" :style="{ 
                  backgroundColor: previewPalette?.colors[1],
                  color: getContrastColor(previewPalette?.colors[1])
                }">
                  Войти
                </button>
              </div>
            </div>
            
            <!-- Основной контент -->
            <div class="ui-content">
              <div class="content-sidebar" :style="{ backgroundColor: previewPalette?.colors[2] }">
                <h4 :style="{ color: getContrastColor(previewPalette?.colors[2]) }">Меню</h4>
                <ul class="sidebar-menu">
                  <li v-for="i in 4" :key="i" class="menu-item">
                    <a href="#" :style="{ color: getContrastColor(previewPalette?.colors[2]) }">
                      Пункт меню {{ i }}
                    </a>
                  </li>
                </ul>
              </div>
              
              <div class="content-main">
                <div class="card-grid">
                  <div 
                    v-for="i in 3" 
                    :key="i" 
                    class="ui-card"
                    :style="{ backgroundColor: previewPalette?.colors[3] }"
                  >
                    <h5 :style="{ color: getContrastColor(previewPalette?.colors[3]) }">Карточка {{ i }}</h5>
                    <p :style="{ color: getContrastColor(previewPalette?.colors[3]) }">
                      Пример контента карточки с текстом.
                    </p>
                    <button class="ui-btn" :style="{ 
                      backgroundColor: previewPalette?.colors[1],
                      color: getContrastColor(previewPalette?.colors[1])
                    }">
                      Кнопка
                    </button>
                  </div>
                </div>
                
                <div class="form-preview">
                  <h4 :style="{ color: previewPalette?.colors[0] }">Форма</h4>
                  <div class="form-group">
                    <label :style="{ color: previewPalette?.colors[0] }">Имя</label>
                    <input 
                      type="text" 
                      class="form-input"
                      :style="{ 
                        borderColor: previewPalette?.colors[1],
                        color: previewPalette?.colors[0]
                      }"
                    >
                  </div>
                  <div class="form-group">
                    <label :style="{ color: previewPalette?.colors[0] }">Email</label>
                    <input 
                      type="email" 
                      class="form-input"
                      :style="{ 
                        borderColor: previewPalette?.colors[1],
                        color: previewPalette?.colors[0]
                      }"
                    >
                  </div>
                  <button class="ui-btn primary" :style="{ 
                    backgroundColor: previewPalette?.colors[1],
                    color: getContrastColor(previewPalette?.colors[1])
                  }">
                    Отправить
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Футер -->
            <div class="ui-footer" :style="{ backgroundColor: previewPalette?.colors[4] || previewPalette?.colors[0] }">
              <div class="footer-content">
                <p :style="{ color: getContrastColor(previewPalette?.colors[4] || previewPalette?.colors[0]) }">
                  © 2025 Все права защищены
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closePreviewModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно шаринга -->
    <div v-if="showShareModalFlag" class="modal-overlay" @click.self="closeShareModal">
      <div class="modal-content">
        <h3>Поделиться палитрой "{{ sharePalette?.name }}"</h3>
        
        <div class="share-methods">
          <!-- Ссылка для шаринга -->
          <div class="share-section">
            <h4>Ссылка для общего доступа</h4>
            <div class="share-link">
              <input 
                type="text" 
                :value="generateShareUrl()" 
                readonly
                class="share-input"
                ref="shareInput"
              >
              <button @click="copyShareUrl" class="btn primary">
                📋
              </button>
            </div>
            <small>Отправьте эту ссылку, чтобы поделиться палитрой</small>
          </div>
          
          <!-- Экспорт для соцсетей -->
          <div class="share-section">
            <h4>Экспорт для социальных сетей</h4>
            <div class="social-buttons">
              <button @click="shareToTwitter" class="social-btn twitter">
                𝕏 Twitter
              </button>
              <button @click="shareToTelegram" class="social-btn telegram">
                📱 Telegram
              </button>
              <button @click="shareToClipboardImage" class="social-btn">
                🖼️ Скопировать изображение
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeShareModal" class="btn">Закрыть</button>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'palettes_v1'

export default {
  name: 'SavedPalettesView',
  setup() {
    const router = useRouter()
    const saved = ref([])
    const searchQuery = ref('')
    const activeFilter = ref('all')
    const sortBy = ref('date')
    
    // Модальные окна
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showExportModalFlag = ref(false)
    const showCssModalFlag = ref(false)
    const showPreviewModalFlag = ref(false)
    const showShareModalFlag = ref(false)
    
    // Данные для модальных окон
    const paletteToDelete = ref(null)
    const exportPalette = ref(null)
    const cssPalette = ref(null)
    const previewPalette = ref(null)
    const sharePalette = ref(null)
    
    // Настройки превью
    const previewTheme = ref('light')
    const previewLayout = ref('desktop')
    
    // Табы
    const activeExportTab = ref('css')
    const activeCssTab = ref('classes')
    
    const exportTabs = [
      { id: 'css', label: 'CSS Variables' },
      { id: 'scss', label: 'SCSS Variables' },
      { id: 'tailwind', label: 'Tailwind Config' },
      { id: 'json', label: 'JSON' }
    ]
    
    const cssTabs = [
      { id: 'classes', label: 'CSS классы' },
      { id: 'utilities', label: 'Утилиты' },
      { id: 'themes', label: 'Темы' }
    ]
    
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

    const shareInput = ref(null)
    const shareQrCode = ref(null)
    
    function showToast(message, type = 'info') {
      toast.value = { message, type }
      setTimeout(() => {
        toast.value.message = ''
      }, 3000)
    }
    
    function loadSaved() {
      const raw = localStorage.getItem(STORAGE_KEY)
      saved.value = raw ? JSON.parse(raw) : []
    }
    
    onMounted(() => {
      loadSaved()
    })
    
    const favoriteCount = computed(() => {
      return saved.value.filter(p => p.favorite).length
    })
    
    const filteredPalettes = computed(() => {
      let result = [...saved.value]
      
      if (activeFilter.value === 'favorites') {
        result = result.filter(p => p.favorite)
      } else if (activeFilter.value === 'recent') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        result = result.filter(p => new Date(p.createdAt) > thirtyDaysAgo)
      }
      
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
      
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'colors':
            return b.colors.length - a.colors.length
          case 'favorites':
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
    
    // Генерация контента для экспорта
    function generateCssVariables() {
      if (!exportPalette.value) return ''
      const colors = exportPalette.value.colors
      let css = ':root {\n'
      colors.forEach((color, index) => {
        css += `  --color-${index + 1}: ${color};\n`
        css += `  --color-primary-${index + 1}: ${color};\n`
      })
      css += '}\n\n'
      css += '/* Пример использования */\n'
      css += '.primary-bg { background-color: var(--color-1); }\n'
      css += '.primary-text { color: var(--color-2); }'
      return css
    }
    
    function generateScssVariables() {
      if (!exportPalette.value) return ''
      const colors = exportPalette.value.colors
      let scss = '// SCSS Variables\n'
      colors.forEach((color, index) => {
        scss += `$color-${index + 1}: ${color};\n`
      })
      scss += '\n'
      scss += '// Map для удобства\n'
      scss += '$colors: (\n'
      colors.forEach((color, index) => {
        scss += `  "color-${index + 1}": ${color},\n`
      })
      scss += ');\n\n'
      scss += '// Функция для получения цвета\n'
      scss += '@function color($name) {\n'
      scss += '  @return map-get($colors, $name);\n'
      scss += '}'
      return scss
    }
    
    function generateTailwindConfig() {
      if (!exportPalette.value) return ''
      const colors = exportPalette.value.colors
      let config = '// tailwind.config.js\n'
      config += 'module.exports = {\n'
      config += '  theme: {\n'
      config += '    extend: {\n'
      config += '      colors: {\n'
      colors.forEach((color, index) => {
        const name = index === 0 ? 'primary' : 
                    index === 1 ? 'secondary' : 
                    index === 2 ? 'accent' : `color-${index + 1}`
        config += `        '${name}': '${color}',\n`
      })
      config += '      }\n'
      config += '    }\n'
      config += '  }\n'
      config += '}'
      return config
    }
    
    function generateJsonExport() {
      if (!exportPalette.value) return ''
      return JSON.stringify({
        name: exportPalette.value.name,
        colors: exportPalette.value.colors,
        type: exportPalette.value.type,
        tags: exportPalette.value.tags || [],
        createdAt: exportPalette.value.createdAt
      }, null, 2)
    }
    
    function generateCssClasses() {
      if (!cssPalette.value) return ''
      const colors = cssPalette.value.colors
      let css = '/* CSS классы для цветов */\n\n'
      
      colors.forEach((color, index) => {
        const name = index === 0 ? 'primary' : 
                    index === 1 ? 'secondary' : 
                    index === 2 ? 'accent' : `color-${index + 1}`
        
        css += `.bg-${name} {\n`
        css += `  background-color: ${color};\n`
        css += `}\n\n`
        
        css += `.text-${name} {\n`
        css += `  color: ${color};\n`
        css += `}\n\n`
        
        css += `.border-${name} {\n`
        css += `  border-color: ${color};\n`
        css += `}\n\n`
      })
      
      return css
    }
    
    function generateUtilityClasses() {
      if (!cssPalette.value) return ''
      const colors = cssPalette.value.colors
      let css = '/* Утилитарные классы */\n\n'
      
      colors.forEach((color, index) => {
        css += `.color-${index + 1} {\n`
        css += `  --current-color: ${color};\n`
        css += `}\n\n`
      })
      
      css += '/* Использование с CSS custom properties */\n'
      css += '.btn {\n'
      css += '  background-color: var(--current-color);\n'
      css += '  color: white;\n'
      css += '  padding: 0.5rem 1rem;\n'
      css += '  border-radius: 0.375rem;\n'
      css += '}\n\n'
      
      css += '.card {\n'
      css += '  border: 2px solid var(--current-color);\n'
      css += '  border-radius: 0.5rem;\n'
      css += '  padding: 1rem;\n'
      css += '}'
      
      return css
    }
    
    function generateThemeCss() {
      if (!cssPalette.value) return ''
      const colors = cssPalette.value.colors
      let css = '/* Светлая и тёмная темы */\n\n'
      
      css += ':root {\n'
      colors.forEach((color, index) => {
        css += `  --color-light-${index + 1}: ${color};\n`
      })
      css += '}\n\n'
      
      css += '@media (prefers-color-scheme: dark) {\n'
      css += '  :root {\n'
      colors.forEach((color, index) => {
        // Немного темнее для тёмной темы
        const darkColor = color.replace(/rgb\((\d+), (\d+), (\d+)\)/, (match, r, g, b) => {
          return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`
        })
        css += `    --color-light-${index + 1}: ${darkColor};\n`
      })
      css += '  }\n'
      css += '}\n\n'
      
      css += '/* Альтернативный вариант с классами */\n'
      css += '.theme-dark {\n'
      colors.forEach((color, index) => {
        const darkColor = color.replace(/rgb\((\d+), (\d+), (\d+)\)/, (match, r, g, b) => {
          return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`
        })
        css += `  --color-light-${index + 1}: ${darkColor};\n`
      })
      css += '}'
      
      return css
    }
    
    function getContrastColor(hex) {
      if (!hex) return '#000000'
      // Простая функция для определения контрастного цвета
      const hexColor = hex.replace('#', '')
      const r = parseInt(hexColor.substr(0, 2), 16)
      const g = parseInt(hexColor.substr(2, 2), 16)
      const b = parseInt(hexColor.substr(4, 2), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5 ? '#000000' : '#ffffff'
    }
    
    function generateShareUrl() {
      if (!sharePalette.value) return ''
      const paletteData = btoa(JSON.stringify({
        name: sharePalette.value.name,
        colors: sharePalette.value.colors,
        type: sharePalette.value.type
      }))
      return `${window.location.origin}/?palette=${paletteData}`
    }
    
    function copyShareUrl() {
      if (shareInput.value) {
        shareInput.value.select()
        navigator.clipboard.writeText(shareInput.value.value)
        showToast('Ссылка скопирована в буфер обмена', 'success')
      }
    }
    
    function shareToTwitter() {
      const text = encodeURIComponent(`Посмотрите мою цветовую палитру "${sharePalette.value.name}"`)
      const url = encodeURIComponent(generateShareUrl())
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    }
    
    function shareToTelegram() {
      const text = encodeURIComponent(`Посмотрите мою цветовую палитру "${sharePalette.value.name}"\n\n${generateShareUrl()}`)
      window.open(`https://t.me/share/url?url=${generateShareUrl()}&text=${text}`, '_blank')
    }
    
    async function shareToClipboardImage() {
      // Здесь можно добавить генерацию изображения палитры
      showToast('Функция генерации изображения в разработке', 'info')
    }
    
    function generateQrCode() {
      const ctx = canvas.getContext('2d')
      const url = generateShareUrl()
      
      // Очищаем канвас
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Простая реализация QR-кода
      ctx.fillStyle = '#000000'
      ctx.fillRect(50, 50, 100, 100)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(60, 60, 80, 80)
      ctx.fillStyle = '#000000'
      ctx.font = '10px Arial'
      ctx.fillText('QR Code', 80, 170)
      
      shareQrCode.value = canvas.toDataURL('image/png')
    }
    
    function downloadQrCode() {
      if (!shareQrCode.value) return
      
      const link = document.createElement('a')
      link.href = shareQrCode.value
      link.download = `palette-${sharePalette.value.name}-qr.png`
      link.click()
    }
    
    // Модальные окна
    function showExportModal(palette) {
      exportPalette.value = palette
      showExportModalFlag.value = true
      activeExportTab.value = 'css'
    }
    
    function closeExportModal() {
      showExportModalFlag.value = false
      exportPalette.value = null
    }
    
    function showCssModal(palette) {
      cssPalette.value = palette
      showCssModalFlag.value = true
      activeCssTab.value = 'classes'
    }
    
    function closeCssModal() {
      showCssModalFlag.value = false
      cssPalette.value = null
    }
    
    function showPreviewModal(palette) {
      previewPalette.value = palette
      showPreviewModalFlag.value = true
      previewTheme.value = 'light'
      previewLayout.value = 'desktop'
    }
    
    function closePreviewModal() {
      showPreviewModalFlag.value = false
      previewPalette.value = null
    }
    
    function showShareModal(palette) {
      sharePalette.value = palette
      showShareModalFlag.value = true
      
      nextTick(() => {
        generateQrCode()
      })
    }
    
    function closeShareModal() {
      showShareModalFlag.value = false
      sharePalette.value = null
      shareQrCode.value = null
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
    
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text)
      showToast('Скопировано в буфер обмена', 'success')
    }
    
    return {
      saved,
      searchQuery,
      activeFilter,
      sortBy,
      showEditModal,
      showDeleteModal,
      showExportModalFlag,
      showCssModalFlag,
      showPreviewModalFlag,
      showShareModalFlag,
      paletteToDelete,
      exportPalette,
      cssPalette,
      previewPalette,
      sharePalette,
      previewTheme,
      previewLayout,
      activeExportTab,
      activeCssTab,
      exportTabs,
      cssTabs,
      editForm,
      toast,
      shareInput,
      shareQrCode,
      filteredPalettes,
      favoriteCount,
      toGradient: (colors) => `linear-gradient(90deg, ${colors.join(',')})`,
      formatDate: (dateString) => {
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
      },
      getTypeName: (type) => {
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
      },
      setFilter,
      goToGenerator: () => router.push('/'),
      toggleFavorite,
      load,
      copyColor: (color) => {
        navigator.clipboard.writeText(color)
        showToast(`Цвет ${color} скопирован`, 'info')
      },
      copyToClipboard,
      generateCssVariables,
      generateScssVariables,
      generateTailwindConfig,
      generateJsonExport,
      generateCssClasses,
      generateUtilityClasses,
      generateThemeCss,
      getContrastColor,
      generateShareUrl,
      copyShareUrl,
      shareToTwitter,
      shareToTelegram,
      shareToClipboardImage,
      downloadQrCode,
      showExportModal,
      closeExportModal,
      showCssModal,
      closeCssModal,
      showPreviewModal,
      closePreviewModal,
      showShareModal,
      closeShareModal,
      saved,
      searchQuery,
      activeFilter,
      sortBy,
      showEditModal,
      showDeleteModal,
      paletteToDelete,
      editForm,
      toast,
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
      editPalette,
      closeModal,
      saveEdit,
      confirmDelete,
      cancelDelete,
      deletePalette,
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

.favorite-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.favorite-btn:hover {
  transform: scale(1.2);
}

.preview {
  height: 120px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.preview:hover {
  opacity: 0.9;
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

.modal-content h3 {
  margin: 0 0 20px 0;
}

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
}

/* Адаптивные модальные окна */
.modal-content.wide {
  max-width: 800px;
}

.modal-content.extra-wide {
  max-width: 1000px;
}

/* Табы экспорта */
.export-tabs {
  display: flex;
  gap: 1px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.export-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 600;
}

.export-tab.active {
  background: var(--accent);
  color: white;
}

.export-tab:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
}

/* Табы CSS */
.css-tabs {
  display: flex;
  gap: 1px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.css-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 600;
}

.css-tab.active {
  background: var(--accent);
  color: white;
}

.css-tab:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
}

/* Контент экспорта */
.export-content,
.css-content {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.export-section,
.css-section {
  margin-bottom: 30px;
}

.export-section h4,
.css-section h4 {
  margin: 0 0 12px 0;
  color: var(--text);
}

.code-block {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

/* UI превью */
.ui-preview {
  margin: 20px 0;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.preview-theme,
.preview-layout {
  display: flex;
  gap: 8px;
}

.theme-btn,
.layout-btn {
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.theme-btn.active,
.layout-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.preview-container {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-container.dark {
  background: #1e293b;
}

.preview-container.mobile {
  max-width: 375px;
  margin: 0 auto;
}

/* Компоненты UI превью */
.ui-header {
  padding: 16px 24px;
  transition: background-color 0.3s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 20px;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.nav-link:hover {
  opacity: 0.8;
}

.ui-content {
  display: flex;
  min-height: 400px;
}

.content-sidebar {
  width: 250px;
  padding: 24px;
  transition: background-color 0.3s ease;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 16px 0 0 0;
}

.menu-item {
  margin-bottom: 12px;
}

.menu-item a {
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.menu-item a:hover {
  opacity: 0.8;
}

.content-main {
  flex: 1;
  padding: 24px;
  background: white;
}

.preview-container.dark .content-main {
  background: #1e293b;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.ui-card {
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.ui-card h5 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.ui-card p {
  margin: 0 0 16px 0;
  font-size: 14px;
  opacity: 0.8;
}

.form-preview {
  max-width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 14px;
  background: transparent;
}

.ui-footer {
  padding: 20px 24px;
  transition: background-color 0.3s ease;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

/* Кнопки UI */
.ui-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ui-btn.primary {
  font-weight: 700;
}

.ui-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Шаринг */
.share-methods {
  margin: 20px 0;
}

.share-section {
  margin-bottom: 30px;
}

.share-section h4 {
  margin: 0 0 12px 0;
  color: var(--text);
}

.share-link {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.share-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.02);
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.social-btn.twitter {
  background: #1da1f2;
  color: white;
}

.social-btn.telegram {
  background: #0088cc;
  color: white;
}

.social-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Карточки */
.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.preview {
  position: relative;
  cursor: pointer;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview:hover .preview-overlay {
  opacity: 1;
}

.preview-text {
  color: white;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .modal-content.wide,
  .modal-content.extra-wide {
    width: 95%;
    max-width: 95%;
  }
  
  .export-tabs,
  .css-tabs {
    flex-direction: column;
  }
  
  .ui-content {
    flex-direction: column;
  }
  
  .content-sidebar {
    width: 100%;
  }
  
  .preview-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .social-buttons {
    grid-template-columns: 1fr;
  }
}
</style>