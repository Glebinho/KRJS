<script>
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3005';

export default {
  data() {
    return {
      processingOptions: {
        format: 'png',
        width: null,
        height: null,
        cropLeft: null,
        cropTop: null,
        cropWidth: null,
        cropHeight: null,
        grayscale: false,
        rotate: null,
        blur: null,
        text: '',
        textX: 0,
        textY: 0,
        textColor: '#000000',
        textSize: 40,
        overlayX: 0,
        overlayY: 0
      },
      mainImage: null,
      overlayImage: null,
      mainPreview: null,
      overlayPreview: null,
      processing: false,
      error: null
    };
  },

  methods: {
    handleMainImage(e) {
      const file = e.target.files[0];
      if (file) {
        this.mainImage = file;
        this.mainPreview = URL.createObjectURL(file);
      }
    },
    
    handleOverlayImage(e) {
      const file = e.target.files[0];
      if (file) {
        this.overlayImage = file;
        this.overlayPreview = URL.createObjectURL(file);
      }
    },
    
    async processImage() {
      this.processing = true;
      this.error = null;
      
      try {
        if (!this.mainImage) {
          throw new Error('Пожалуйста, загрузите основное изображение');
        }

        const formData = new FormData();
        
        formData.append('file', this.mainImage);
        
        if (this.overlayImage) {
          formData.append('overlay', this.overlayImage);
        }
        
        const optionsToSend = {
          ...this.processingOptions,
          grayscale: this.processingOptions.grayscale.toString()
        };

        for (const key in optionsToSend) {
          if (optionsToSend[key] !== null && optionsToSend[key] !== '') {
            formData.append(key, optionsToSend[key]);
          }
        }
        
        const response = await axios.post('/processimage', formData, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `processed-image.${this.processingOptions.format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
      } catch (err) {
        console.error('Ошибка обработки:', err);
        this.error = err.response?.data?.error || err.message;
      } finally {
        this.processing = false;
      }
    }
  }
};
</script>

<template>
  <div class="app">
    <div class="container my-3">
      <div class="row row-cols-1 row-cols-md-2 justify-content-center">
        <div class="col">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Основные параметры</h5>
              
              <div class="mb-3">
                <label class="form-label">Формат вывода:</label>
                <select v-model="processingOptions.format" class="form-select">
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                  <option value="webp">WEBP</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Основное изображение:</label>
                <input 
                  type="file" 
                  class="form-control" 
                  @change="handleMainImage" 
                  accept="image/*" 
                  required
                >
                <img v-if="mainPreview" :src="mainPreview" class="preview-img mt-2">
              </div>

              <div class="row mb-3">
                <div class="col">
                  <label class="form-label">Ширина:</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model.number="processingOptions.width" 
                    min="1"
                  >
                </div>
                <div class="col">
                  <label class="form-label">Высота:</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model.number="processingOptions.height" 
                    min="1"
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Операции обработки</h5>
              
              <div class="mb-3">
                <label class="form-label">Обрезка:</label>
                <div class="row g-2">
                  <div class="col-6 col-md-3">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.cropLeft" 
                      placeholder="Left"
                    >
                  </div>
                  <div class="col-6 col-md-3">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.cropTop" 
                      placeholder="Top"
                    >
                  </div>
                  <div class="col-6 col-md-3">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.cropWidth" 
                      placeholder="Width"
                    >
                  </div>
                  <div class="col-6 col-md-3">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.cropHeight" 
                      placeholder="Height"
                    >
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check mb-2">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="processingOptions.grayscale"
                  >
                  <label class="form-check-label">Оттенки серого</label>
                </div>
                
                <div class="row g-2">
                  <div class="col">
                    <label class="form-label">Поворот (градусы):</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.rotate" 
                      min="0" 
                      max="360"
                    >
                  </div>
                  <div class="col">
                    <label class="form-label">Размытие (радиус):</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.blur" 
                      min="0" 
                      max="100"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Добавить текст</h5>
              
              <div class="mb-3">
                <input 
                  type="text" 
                  class="form-control mb-2" 
                  v-model="processingOptions.text" 
                  placeholder="Текст"
                >
                <div class="row g-2 mb-2">
                  <div class="col">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.textX" 
                      placeholder="X позиция"
                    >
                  </div>
                  <div class="col">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.textY" 
                      placeholder="Y позиция"
                    >
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col">
                    <label class="form-label">Цвет текста:</label>
                    <input 
                      type="color" 
                      class="form-control form-control-color" 
                      v-model="processingOptions.textColor"
                    >
                  </div>
                  <div class="col">
                    <label class="form-label">Размер шрифта:</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.textSize" 
                      min="10" 
                      max="100"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Наложение изображения</h5>
              
              <div class="mb-3">
                <input 
                  type="file" 
                  class="form-control mb-2" 
                  @change="handleOverlayImage" 
                  accept="image/*"
                >
                <img v-if="overlayPreview" :src="overlayPreview" class="preview-img mt-2">
                <div class="row g-2 mt-2">
                  <div class="col">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.overlayX" 
                      placeholder="X позиция"
                    >
                  </div>
                  <div class="col">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="processingOptions.overlayY" 
                      placeholder="Y позиция"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <button 
                @click="processImage" 
                class="btn btn-primary w-100" 
                :disabled="processing || !mainImage"
              >
                <span v-if="processing" class="spinner-border spinner-border-sm" role="status"></span>
                {{ processing ? 'Обработка...' : 'Обработать изображение' }}
              </button>

              <div v-if="error" class="alert alert-danger mt-3 mb-0">
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.preview-img {
  max-width: 100%;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: block;
}

.app {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 20px 0;
}

.card {
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-body {
  padding: 1.5rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.btn-primary {
  padding: 10px;
  font-size: 1.1rem;
}

.alert {
  margin-top: 1rem;
}
</style>