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
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }
}