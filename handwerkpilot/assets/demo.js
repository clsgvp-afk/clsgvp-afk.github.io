/**
 * Static portfolio preview only: replaces the WordPress submit (admin-post.php)
 * with a local confirmation. Nothing is stored or sent.
 *
 * Fix 2026-11: the old version showed "Demo erfolgreich abgeschlossen" for an
 * empty form. Success is now shown only when every step is valid.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-demo-form="true"]');
  if (!form) return;
  const guard = form.querySelector("[data-static-guard]");
  if (guard) guard.disabled = false;

  const note = form.querySelector('.hp-step[data-step="6"] .small');
  if (note) note.textContent = 'Portfolio-Demo: Es werden keine Daten gespeichert oder versendet.';

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // never leave the page in the static preview
    const fields = [...form.querySelectorAll('input, textarea, select')]
      .filter((field) => field.type !== 'hidden' && !field.closest('[aria-hidden="true"]'));
    if (fields.some((field) => !field.checkValidity())) return; // form.js shows the first error

    let message = form.previousElementSibling;
    if (!message || !message.classList.contains('hp-demo-success')) {
      message = document.createElement('p');
      message.className = 'notice success hp-demo-success';
      message.setAttribute('role', 'status');
      form.parentNode.insertBefore(message, form);
    }
    message.textContent = 'Demo abgeschlossen: Alle Angaben sind gültig. Es wurden keine Daten gespeichert oder versendet.';
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
