import { Modal, App, Setting, Notice, Plugin } from 'obsidian';

interface Color {
  r: number;
  g: number;
  b: number;
}

class ColorPicker {
  hue: number;
  saturation: number;
  lightness: number;
  opacity: number;

  constructor() {
    this.hue = 0;
    this.saturation = 100;
    this.lightness = 50;
    this.opacity = 1;
  }

  setHue(hue: number) {
    this.hue = hue;
  }

  setSaturation(saturation: number) {
    this.saturation = saturation;
  }

  setLightness(lightness: number) {
    this.lightness = lightness;
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
  }

  convertToRGB(): { r: number; g: number; b: number; a: number } {
    const h = this.hue / 360;
    const s = this.saturation / 100;
    const l = this.lightness / 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: this.opacity };
  }

  getHex(): string {
    const rgbColor = this.convertToRGB();
    return this.rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a);
  }

  setFromHex(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    let a;
    if (hex.length === 9) {
      a = parseInt(hex.slice(7, 9), 16) / 255;
    } else {
      a = 1; // default to fully opaque if alpha channel is not provided
    }
    this.hue = this.rgbToHue(r, g, b);
    this.saturation = this.rgbToSaturation(r, g, b);
    this.lightness = this.rgbToLightness(r, g, b);
    this.opacity = a;
  }
  
  
  
  

  

  rgbToHex(r: number, g: number, b: number, a: number): string {
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    const aHex = Math.round(a * 255);
    return `#${hex(r)}${hex(g)}${hex(b)}${hex(aHex)}`;
  }

  rgbToHue(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return Math.round(h * 360);
  }

  rgbToSaturation(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let s: number, l: number;

    l = (max + min) / 2;

    if (max === min) {
      s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    }
    return Math.round(s * 100);
  }

  rgbToLightness(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let l: number;

    l = (max + min) / 2;

    return Math.round(l * 100);
  }
}

class ColorPickerModal extends Modal {
  colorPicker: ColorPicker;
  hexInput: HTMLInputElement;
  colorPreviewBox: HTMLElement;

  constructor(app: App, colorPicker: ColorPicker) {
    super(app);
    this.colorPicker = colorPicker;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Choose a color' });

    new Setting(contentEl)
      .setName('Hue')
      .addSlider(slider => slider
        .setLimits(0, 360, 1)
        .setValue(this.colorPicker.hue)
        .onChange((value: number) => {
          this.colorPicker.setHue(value);
          this.updateHexInput();
          this.updateColorPreview();
        }));

    new Setting(contentEl)
      .setName('Saturation')
      .addSlider(slider => slider
        .setLimits(0, 100, 1)
        .setValue(this.colorPicker.saturation)
        .onChange((value: number) => {
          this.colorPicker.setSaturation(value);
          this.updateHexInput();
          this.updateColorPreview();
        }));

    new Setting(contentEl)
      .setName('Lightness')
      .addSlider(slider => slider
        .setLimits(0, 100, 1)
        .setValue(this.colorPicker.lightness)
        .onChange((value: number) => {
          this.colorPicker.setLightness(value);
          this.updateHexInput();
          this.updateColorPreview();
        }));

    new Setting(contentEl)
      .setName('Opacity')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.01)
        .setValue(this.colorPicker.opacity)
        .onChange((value: number) => {
          this.colorPicker.setOpacity(value);
          this.updateHexInput();
          this.updateColorPreview();
        }));

        new Setting(contentEl)
        .setName('HEX')
        .addText(text => {
          text.inputEl.type = 'text';
          text.inputEl.pattern = '[#][0-9a-fA-F]{6,8}';
          text.setValue(this.colorPicker.getHex());
          text.onChange((value: string) => {
            if (/^#[0-9a-fA-F]{6,8}$/.test(value)) {
              this.colorPicker.setFromHex(value);
              this.updateSliders();
              this.updateColorPreview();
            }
          });
          this.hexInput = text.inputEl;
        });      
      
      
      

    this.colorPreviewBox = contentEl.createEl('div', { cls: 'color-preview-box' });
    this.colorPreviewBox.style.height = '50px';
    this.colorPreviewBox.style.width = '100%';
    this.colorPreviewBox.style.border = '1px solid #ddd';
    this.updateColorPreview();

    new Setting(contentEl)
      .addButton(button => {
        button.setButtonText('Save')
          .onClick(() => {
            const rgbColor = this.colorPicker.convertToRGB();
            const colorString = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${rgbColor.a})`;
            document.documentElement.style.setProperty('--selected-color', colorString);
            new Notice(`Color ${colorString} saved!`);
            this.close();
          });
      });
  }

  private updateHexInput() {
    const rgbColor = this.colorPicker.convertToRGB();
    this.hexInput.value = this.colorPicker.rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a);
  }

  private updateSliders() {
    // Update hue, saturationss, lightne, and opacity sliders based on the HEX value
    // ...
  }

  private updateColorPreview() {
    const hexColor = this.colorPicker.getHex();
    this.colorPreviewBox.style.backgroundColor = hexColor;
  }
}



export default class TextColorPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'textcolor',
      name: 'Change Text Color',
      callback: () => {
        const colorPicker = new ColorPicker();
        new ColorPickerModal(this.app, colorPicker).open();
      },
    });
  }
}