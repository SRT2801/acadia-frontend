import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputDirective } from '../../shared/ui/input/input.directive';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { CoursesService, Course } from '../../shared/services/courses.service';
import { AlertService } from '../../shared/services/alert.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonComponent,
    InputDirective,
    ModalComponent,
    SkeletonComponent,
  ],
  templateUrl: './course-list.component.html',
})
export class CourseListComponent implements OnInit {
  private coursesService = inject(CoursesService);
  private alert = inject(AlertService);
  private auth = inject(AuthService);

  canCreate = this.auth.canCreateCourse;
  private router = inject(Router);

  courses = signal<Course[]>([]);
  loading = signal(true);
  showJoinModal = signal(false);
  joinCode = signal('');
  joinError = signal('');
  joining = signal(false);

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.coursesService.getCourses().subscribe({
      next: ({ courses }) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Failed to load courses');
        this.loading.set(false);
      },
    });
  }

  openJoinModal() {
    this.showJoinModal.set(true);
    this.joinCode.set('');
    this.joinError.set('');
  }

  closeJoinModal() {
    this.showJoinModal.set(false);
    this.joinCode.set('');
    this.joinError.set('');
  }

  joinCourse() {
    const code = this.joinCode().trim();
    if (!code) {
      this.joinError.set('Please enter a code');
      return;
    }

    this.joining.set(true);
    this.joinError.set('');

    this.coursesService.joinCourse(code).subscribe({
      next: ({ course }) => {
        this.joining.set(false);
        this.closeJoinModal();
        this.courses.update((list) => [...list, course]);
        this.alert.success(`Joined ${course.name} successfully`);
      },
      error: (err) => {
        this.joining.set(false);
        this.joinError.set(err.error?.message ?? 'Invalid or expired code');
      },
    });
  }

  navigateToCourse(course: Course) {
    this.router.navigate(['/app/courses', course.id]);
  }
}