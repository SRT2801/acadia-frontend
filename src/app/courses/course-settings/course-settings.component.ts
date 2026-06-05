import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputDirective } from '../../shared/ui/input/input.directive';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import {
  CoursesService,
  Course,
  AcademicSpace,
  UpdateSpaceDto,
} from '../../shared/services/courses.service';
import { AuthService } from '../../shared/services/auth.service';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-course-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputDirective, SkeletonComponent],
  templateUrl: './course-settings.component.html',
  host: {
    class: 'flex-1 flex flex-col min-h-0',
  },
})
export class CourseSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesService = inject(CoursesService);
  private auth = inject(AuthService);
  private alert = inject(AlertService);

  course = signal<Course | null>(null);
  space = signal<AcademicSpace | null>(null);
  loading = signal(true);
  savingCourse = signal(false);
  savingSpace = signal(false);

  courseForm = {
    name: '',
    code: '',
    description: '',
    semester: '',
  };

  spaceForm = {
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
    allowStudentPosts: false,
    allowFileUploads: false,
    allowVoiceChannels: false,
    showLeaderboard: false,
  };

  canDelete = signal(false);

  ngOnInit() {
    const id = this.getCourseId();
    if (id) {
      this.loadData(id);
    }
  }

  private getCourseId(): number {
    let id = 0;
    this.route.parent?.paramMap.subscribe((params) => {
      id = Number(params.get('id'));
    });
    return id;
  }

  private loadData(courseId: number) {
    this.loading.set(true);

    this.coursesService.getCourse(courseId).subscribe({
      next: ({ course }) => {
        this.course.set(course);
        this.courseForm = {
          name: course.name ?? '',
          code: course.code ?? '',
          description: course.description ?? '',
          semester: course.semester ?? '',
        };

        const user = this.auth.currentUser();
        const isOwnerOrProfessor = user && ['OWNER', 'PROFESSOR'].includes(user.roleName);
        this.canDelete.set(!!isOwnerOrProfessor);

        this.coursesService.getSpace(courseId).subscribe({
          next: ({ space }) => {
            this.space.set(space);
            this.spaceForm = {
              visibility: space.visibility ?? 'PRIVATE',
              allowStudentPosts:
                (space.settings as Record<string, boolean>)['allowStudentPosts'] ?? false,
              allowFileUploads:
                (space.settings as Record<string, boolean>)['allowFileUploads'] ?? false,
              allowVoiceChannels:
                (space.settings as Record<string, boolean>)['allowVoiceChannels'] ?? false,
              showLeaderboard:
                (space.settings as Record<string, boolean>)['showLeaderboard'] ?? false,
            };
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('Error al cargar el curso');
      },
    });
  }

  saveCourse() {
    const course = this.course();
    if (!course) return;

    this.savingCourse.set(true);
    this.coursesService
      .updateCourse(course.id, {
        name: this.courseForm.name,
        code: this.courseForm.code,
        description: this.courseForm.description || undefined,
        semester: this.courseForm.semester || undefined,
      })
      .subscribe({
        next: ({ course: updated }) => {
          this.course.set(updated);
          this.savingCourse.set(false);
          this.alert.success('Cambios guardados');
        },
        error: (err: { error?: { message?: string } }) => {
          this.savingCourse.set(false);
          this.alert.error(err.error?.message ?? 'Error al guardar');
        },
      });
  }

  saveSpace() {
    const course = this.course();
    if (!course) return;

    this.savingSpace.set(true);
    const dto: UpdateSpaceDto = {
      visibility: this.spaceForm.visibility,
      allowStudentPosts: this.spaceForm.allowStudentPosts,
      allowFileUploads: this.spaceForm.allowFileUploads,
      allowVoiceChannels: this.spaceForm.allowVoiceChannels,
      showLeaderboard: this.spaceForm.showLeaderboard,
    };

    this.coursesService.updateSpace(course.id, dto).subscribe({
      next: ({ space }) => {
        this.space.set(space);
        this.savingSpace.set(false);
        this.alert.success('Configuración del espacio guardada');
      },
      error: (err: { error?: { message?: string } }) => {
        this.savingSpace.set(false);
        this.alert.error(err.error?.message ?? 'Error al guardar');
      },
    });
  }

  confirmDelete() {
    const course = this.course();
    if (!course) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar "${course.name}"? Esta acción es irreversible y eliminará todos los canales, miembros e invitaciones.`,
    );
    if (!confirmed) return;

    this.coursesService.deleteCourse(course.id).subscribe({
      next: () => {
        this.alert.success('Curso eliminado');
        this.router.navigate(['/app/courses']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.alert.error(err.error?.message ?? 'Error al eliminar el curso');
      },
    });
  }
}
