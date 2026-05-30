import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto p-lg">
      <h1 class="text-headline-md mb-lg">Miembros</h1>
    </div>
  `,
})
export class CourseMembersComponent {}
