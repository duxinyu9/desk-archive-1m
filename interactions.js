/* Give command buttons a brief green acknowledgement after a click.
   Existing selected/toggle classes continue to control persistent selection. */
(function () {
  'use strict';
  const controls = 'button, a[href], [role="button"], [role="menuitem"], ' +
    'input[type="button"], input[type="submit"], .desktop-icon, .thumb, ' +
    '.dl-file-item, .start-menu-list li, .qq-file-link, .lv-row, #arc-list li, .card';
  const timers = new WeakMap();

  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest(controls);
    if (!control || control.matches(':disabled, [aria-disabled="true"], .hotzone, .mine-cell.open')) return;
    clearTimeout(timers.get(control));
    control.setAttribute('data-interaction-clicked', '');
    timers.set(control, setTimeout(function () {
      control.removeAttribute('data-interaction-clicked');
      timers.delete(control);
    }, 180));
  }, true);
})();
