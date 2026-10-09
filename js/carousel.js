// Global variables
let currentSlide = 0;
const totalSlides = 3;
let autoplayInterval;
const AUTOPLAY_DELAY = 7000;

document.addEventListener('DOMContentLoaded', () => {
 initCarousel();
 startAutoplay();
});

function initCarousel() {
 const videos = document.querySelectorAll('.carousel-video');
 if (videos[0]) {
   videos[0].play().catch(e => console.log('Autoplay prevented:', e));
 }
 // Preload others
 videos.forEach((video, index) => {
   if (index > 0) video.load();
 });
}

function goToSlide(slideIndex) {
 stopAutoplay();
 const slides = document.querySelectorAll('.carousel-slide');
 const videos = document.querySelectorAll('.carousel-video');
 const dots = document.querySelectorAll('.pagination-dot');
 if (!slides.length) return;
 slides[currentSlide].classList.remove('active');
 dots[currentSlide].classList.remove('active');
 if (videos[currentSlide]) videos[currentSlide].pause();
 currentSlide = slideIndex;
 slides[currentSlide].classList.add('active');
 dots[currentSlide].classList.add('active');
 if (videos[currentSlide]) {
   videos[currentSlide].currentTime = 0;
   videos[currentSlide].play().catch(e => console.log('Autoplay prevented:', e));
 }
 setTimeout(() => startAutoplay(), 3000);
}

function nextSlide() {
 const nextIndex = (currentSlide + 1) % totalSlides;
 goToSlide(nextIndex);
}

function prevSlide() {
 const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
 goToSlide(prevIndex);
}

function startAutoplay() {
 stopAutoplay();
 autoplayInterval = setInterval(() => {
   const nextIndex = (currentSlide + 1) % totalSlides;
   // Direct slide switch without fully stopping autoplay state
   const slides = document.querySelectorAll('.carousel-slide');
   const videos = document.querySelectorAll('.carousel-video');
   const dots = document.querySelectorAll('.pagination-dot');
   if (!slides.length) return;
   slides[currentSlide].classList.remove('active');
   dots[currentSlide].classList.remove('active');
   if (videos[currentSlide]) videos[currentSlide].pause();
   currentSlide = nextIndex;
   slides[currentSlide].classList.add('active');
   dots[currentSlide].classList.add('active');
   if (videos[currentSlide]) {
     videos[currentSlide].currentTime = 0;
     videos[currentSlide].play().catch(e => console.log('Autoplay prevented:', e));
   }
 }, AUTOPLAY_DELAY);
}

function stopAutoplay() {
 if (autoplayInterval) clearInterval(autoplayInterval);
}

// Window Exposes
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;
window.scrollToProducts = function (handle) {
 const p = document.getElementById('products');
 if (p) p.scrollIntoView({ behavior: 'smooth' });
};
