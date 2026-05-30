import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { CoursesService } from '../../shared/services/courses.service';
import { UniversitiesService, University } from '../../shared/services/universities.service';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ModalComponent],
  templateUrl: './course-form.component.html',
})
export class CourseFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private coursesService = inject(CoursesService);
  private universitiesService = inject(UniversitiesService);
  private alert = inject(AlertService);
  private router = inject(Router);
  private statusSub?: Subscription;

  universities = signal<University[]>([]);
  submitting = signal(false);
  showSuccessModal = signal(false);
  invitationCode = signal('');
  copyLabel = signal('Copiar');
  formValid = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    code: [''],
    description: [''],
    semester: [''],
    universityId: ['', [Validators.required]],
  });

  ngOnInit() {
    this.statusSub = this.form.statusChanges.subscribe(() => {
      this.formValid.set(this.form.valid);
    });

    this.universitiesService.findAll().subscribe({
      next: (universities) => {
        this.universities.set(universities);
      },
      error: () => {
        this.alert.error('No se pudieron cargar las universidades');
      },
    });
  }

  ngOnDestroy() {
    this.statusSub?.unsubscribe();
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.invitationCode());
      this.copyLabel.set('Copiado');
      setTimeout(() => this.copyLabel.set('Copiar'), 2000);
    } catch {
      this.copyLabel.set('Error');
    }
  }

  goToCourses() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/app/courses']);
  }

  closeModal() {
    this.showSuccessModal.set(false);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const codeValue = this.form.controls.code.value.trim();
    const dto = {
      name: this.form.controls.name.value.trim(),
      code: codeValue || undefined,
      description: this.form.controls.description.value.trim() || undefined,
      semester: this.form.controls.semester.value.trim() || undefined,
      universityId: +this.form.controls.universityId.value,
    };

    this.coursesService.createCourse(dto).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.invitationCode.set(res.invitation.code);
        this.showSuccessModal.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.submitting.set(false);
        const message =
          err.error?.details?.message ??
          err.error?.message ??
          'No se pudo crear la materia. Intenta de nuevo.';
        this.alert.error(message);
      },
    });
  }
}
