import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessibilityWidgetComponent } from './components/accessibility-widget/accessibility-widget.component';
import { AccessibilityThemeService } from './services/accessibility-theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AccessibilityWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'skillup-frontend';
  // El servicio se inyecta aquí para inicializar las preferencias de tema y accesibilidad de forma global
  public readonly a11y = inject(AccessibilityThemeService);
}
