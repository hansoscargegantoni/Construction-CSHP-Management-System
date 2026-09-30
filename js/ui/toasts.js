/**
 * Toast Notification Service
 * Displays sleek floating alerts for system actions
 */

class ToastService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  show(message, type = 'info', duration = 3500) {
    this._ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;

    const iconMap = {
      success: '✓',
      warning: '⚠️',
      danger: '✕',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
      <div class="toast-content">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }

  success(msg, duration) { this.show(msg, 'success', duration); }
  warning(msg, duration) { this.show(msg, 'warning', duration); }
  danger(msg, duration) { this.show(msg, 'danger', duration); }
  info(msg, duration) { this.show(msg, 'info', duration); }
}

export const toasts = new ToastService();
