import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-lg mx-auto p-lg">
        <h1 class="text-headline-md mb-lg">Configuración</h1>
      </div>
    </div>
  `,
})
export class CourseSettingsComponent {}
