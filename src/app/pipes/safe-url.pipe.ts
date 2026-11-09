import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;

    let finalUrl = url;

    if (url.includes('youtube.com/watch?v=')) {
      finalUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
      finalUrl = finalUrl.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      finalUrl = url.replace('youtu.be/', 'youtube.com/embed/');
      finalUrl = finalUrl.split('?')[0];
    }

    // Habilitar JS API y forzar subtítulos automáticos en español (CC) en YouTube
    if (finalUrl.includes('youtube.com/embed/')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:4200';
      finalUrl += `${separator}enablejsapi=1&origin=${encodeURIComponent(origin)}&cc_load_policy=1&hl=es`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }
}
