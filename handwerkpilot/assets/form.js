/**
 * HandwerkPilot – multi-step request form.
 *
 * Progressive enhancement: the server validates everything again in
 * HandwerkPilot_Core::submit(). This script only guides the visitor step by
 * step and prevents an obviously incomplete form from being sent.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hp-form').forEach(initForm);
});

const LABELS = {
  diagnose: 'Störung & Diagnose',
  steckdose: 'Steckdose oder Schalter',
  leuchte: 'Leuchtenmontage',
  sonstiges: 'Andere Elektroarbeit',
  normal: 'Normal',
  urgent: 'Dringend',
};

function initForm(form) {
  const steps = [...form.querySelectorAll('.hp-step')];
  const bars = [...form.querySelectorAll('.hp-progress span')];
  const next = form.querySelector('[data-next]');
  const prev = form.querySelector('[data-prev]');
  const submit = form.querySelector('[data-submit]');
  const stepLabel = form.querySelector('[data-step-label]');
  const photo = form.querySelector('input[type="file"][data-max-bytes]');
  let index = 0;

  const fieldsOf = (step) => [...step.querySelectorAll('input, textarea, select')]
    .filter((field) => field.type !== 'hidden' && !field.closest('[aria-hidden="true"]'));

  // Client-side size check so the visitor learns about a too large photo
  // before sending. The server checks again.
  photo?.addEventListener('change', () => {
    const file = photo.files[0];
    const max = Number(photo.dataset.maxBytes);
    photo.setCustomValidity(file && file.size > max ? 'Die Datei ist größer als 5 MB.' : '');
  });

  const firstInvalid = (step) => fieldsOf(step).find((field) => !field.checkValidity());

  function show({ focus = true } = {}) {
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
    bars.forEach((bar, i) => bar.classList.toggle('active', i <= index));
    const last = index === steps.length - 1;
    prev.hidden = index === 0;
    next.hidden = last;
    submit.hidden = !last;
    if (stepLabel) stepLabel.textContent = `Schritt ${index + 1} von ${steps.length}`;
    if (last) renderSummary();
    if (focus) steps[index].querySelector('input, textarea, select, h3')?.focus({ preventScroll: false });
  }

  function renderSummary() {
    const data = new FormData(form);
    const summary = form.querySelector('[data-summary]');
    const rows = [
      ['Leistung', LABELS[data.get('service')] || ''],
      ['Beschreibung', data.get('description') || ''],
      ['Dringlichkeit', LABELS[data.get('urgency')] || ''],
      ['Wunschtermin', data.get('preferred_date') || ''],
      ['Kontakt', [data.get('customer_name'), data.get('email')].filter(Boolean).join(', ')],
    ];
    // Build with textContent – user input is never inserted as HTML.
    summary.replaceChildren(...rows.map(([label, value]) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      p.append(strong, document.createTextNode(String(value)));
      return p;
    }));
  }

  next.addEventListener('click', () => {
    const invalid = firstInvalid(steps[index]);
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    index = Math.min(index + 1, steps.length - 1);
    show();
  });

  prev.addEventListener('click', () => {
    index = Math.max(index - 1, 0);
    show();
  });

  // Guard against submitting from any state (Enter key, visible button due
  // to theme CSS, browser autofill …): jump to the first incomplete step.
  form.addEventListener('submit', (event) => {
    const stepWithError = steps.findIndex((step) => firstInvalid(step));
    if (stepWithError !== -1) {
      event.preventDefault();
      event.stopImmediatePropagation();
      index = stepWithError;
      show({ focus: false });
      firstInvalid(steps[index]).reportValidity();
    }
  });

  show({ focus: false });
}
