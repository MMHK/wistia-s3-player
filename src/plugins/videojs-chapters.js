import videojs from 'video.js';

const ChapterMarker = videojs.getComponent('Component');

class ChaptersMarker extends ChapterMarker {
  constructor(player, options) {
    super(player, options);
    this.markerTime = options.markerTime;
    this.title = options.title || '';
    this.on('click', this.handleClick);
  }

  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-chapter-marker',
    });
    el.setAttribute('data-title', this.title);
    el.setAttribute('data-time', this.markerTime);
    return el;
  }

  handleClick() {
    this.player().currentTime(this.markerTime);
  }
}

videojs.registerComponent('ChaptersMarker', ChaptersMarker);

const ChaptersButton = videojs.getComponent('MenuButton');

class CustomChaptersButton extends ChaptersButton {
  constructor(player, options) {
    super(player, options);
    this.markers = options.markers || [];
    this.controlText('Chapters');
  }

  createEl() {
    const el = super.createEl();
    el.className = 'vjs-chapters-button vjs-control vjs-menu-button vjs-menu-button-popup';
    return el;
  }

  buildCSSClass() {
    return `vjs-chapters-button ${super.buildCSSClass()}`;
  }

  createItems() {
    const items = [];
    const player = this.player();
    const markers = this.markers || [];

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const item = new videojs.getComponent('MenuItem')(player, {
        label: marker.title,
        selectable: true,
        selected: player.currentTime() >= marker.time && (i === markers.length - 1 || player.currentTime() < markers[i + 1].time),
      });

      item.on('click', () => {
        player.currentTime(marker.time);
      });

      items.push(item);
    }

    return items;
  }

  update() {
    super.update();
    if (this.menu && this.menu.children && this.menu.children().length > 0) {
      this.show();
    } else {
      this.hide();
    }
  }
}

videojs.registerComponent('CustomChaptersButton', CustomChaptersButton);

function chaptersPlugin(options = {}) {
  const player = this;
  const markers = options.markers || [];

  if (!markers.length) return;

  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  const controlBar = player.getChild('controlBar');
  if (controlBar && !controlBar.getChild('CustomChaptersButton')) {
    const chaptersButton = controlBar.addChild('CustomChaptersButton', { markers: sortedMarkers });
    controlBar.el().appendChild(chaptersButton.el());
  }

  renderProgressMarkers(player, sortedMarkers);

  player.on('dispose', () => {
    removeProgressMarkers(player);
  });
}

function renderProgressMarkers(player, markers) {
  const progressHolder = player.el().querySelector('.vjs-progress-holder');
  if (!progressHolder) return;

  const duration = player.duration();
  if (!duration || !isFinite(duration)) return;

  const existingMarkers = progressHolder.querySelectorAll('.vjs-chapter-marker');
  existingMarkers.forEach(m => m.remove());

  markers.forEach(marker => {
    if (marker.time < 0 || marker.time > duration) return;

    const markerEl = document.createElement('div');
    markerEl.className = 'vjs-chapter-marker';
    markerEl.setAttribute('data-title', marker.title);
    markerEl.setAttribute('data-time', marker.time);
    markerEl.style.left = `${(marker.time / duration) * 100}%`;
    markerEl.style.position = 'absolute';
    markerEl.style.top = '-2px';
    markerEl.style.bottom = '-2px';
    markerEl.style.width = '6px';
    markerEl.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    markerEl.style.cursor = 'pointer';
    markerEl.style.zIndex = '3';

    markerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      player.currentTime(marker.time);
    });

    progressHolder.appendChild(markerEl);
  });
}

function removeProgressMarkers(player) {
  const progressHolder = player.el().querySelector('.vjs-progress-holder');
  if (!progressHolder) return;

  const markers = progressHolder.querySelectorAll('.vjs-chapter-marker');
  markers.forEach(m => m.remove());
}

videojs.registerPlugin('chapters', chaptersPlugin);

export default chaptersPlugin;
