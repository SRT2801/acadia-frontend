import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CourseSidebarComponent } from './course-sidebar/course-sidebar.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputDirective } from '../../shared/ui/input/input.directive';
import { FormsModule } from '@angular/forms';
import { CoursesService, Course, Channel, ChannelCategory } from '../../shared/services/courses.service';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-course-workspace',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    FormsModule,
    CourseSidebarComponent,
    ModalComponent,
    ButtonComponent,
    InputDirective,
  ],
  templateUrl: './course-workspace.component.html',
})
export class CourseWorkspaceComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesService = inject(CoursesService);
  private alert = inject(AlertService);

  private routerSub?: Subscription;
  private paramSub?: Subscription;

  course = signal<Course | null>(null);
  channels = signal<Channel[]>([]);
  categories = signal<ChannelCategory[]>([]);
  memberCount = signal(0);
  userCourses = signal<Course[]>([]);
  courseLoading = signal(true);
  showCreateChannelModal = signal(false);

  channelName = signal('');
  channelType = signal<'TEXT' | 'ANNOUNCEMENT' | 'TASKS' | 'VOICE' | 'FORUM' | 'RESOURCES'>('TEXT');
  channelDescription = signal('');
  channelIsLocked = signal(false);
  creatingChannel = signal(false);

  courseId = signal(0);

  activeChannelIndex = signal(0);

  channelTypes = [
    { value: 'TEXT' as const, label: 'Chat', icon: 'chat' },
    { value: 'ANNOUNCEMENT' as const, label: 'Anuncios', icon: 'campaign' },
    { value: 'TASKS' as const, label: 'Tareas', icon: 'assignment' },
    { value: 'FORUM' as const, label: 'Foro', icon: 'forum' },
    { value: 'RESOURCES' as const, label: 'Recursos', icon: 'folder' },
    { value: 'VOICE' as const, label: 'Voz', icon: 'mic' },
  ];

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.courseId.set(id);
        this.courseLoading.set(true);
        this.loadCourse(id);
        this.loadChannels(id);
        this.loadMembers(id);
      }
    });

    this.loadUserCourses();

    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const child = this.route.snapshot.firstChild;
        if (child) {
          const indexParam = child.paramMap.get('channelIndex');
          if (indexParam !== null) {
            this.activeChannelIndex.set(Number(indexParam));
          }
        }
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }

  private loadCourse(courseId: number) {
    this.coursesService.getCourse(courseId).subscribe({
      next: ({ course }) => {
        this.course.set(course);
      },
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Failed to load course');
        this.courseLoading.set(false);
      },
    });
  }

  private loadChannels(courseId: number) {
    this.coursesService.getChannels(courseId).subscribe({
      next: (res) => {
        this.channels.set(res.channels?.items ?? []);
        this.categories.set(res.categories?.items ?? []);
        this.courseLoading.set(false);
      },
      error: () => {
        this.courseLoading.set(false);
      },
    });
  }

  private loadMembers(courseId: number) {
    this.coursesService.getMembers(courseId).subscribe({
      next: ({ total }) => {
        this.memberCount.set(total);
      },
    });
  }

  private loadUserCourses() {
    this.coursesService.getCourses().subscribe({
      next: ({ courses }) => {
        this.userCourses.set(courses);
      },
    });
  }

  isCurrentCourse(courseId: number): boolean {
    return this.courseId() === courseId;
  }

  getCourseInitials(course: Course): string {
    const parts = course.name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[1][0]
      : course.name.substring(0, 2);
  }

  openCreateChannelModal() {
    this.channelName.set('');
    this.channelType.set('TEXT');
    this.channelDescription.set('');
    this.channelIsLocked.set(false);
    this.creatingChannel.set(false);
    this.showCreateChannelModal.set(true);
  }

  closeCreateChannelModal() {
    this.showCreateChannelModal.set(false);
  }

  createChannel() {
    const name = this.channelName().trim();
    if (!name) return;

    this.creatingChannel.set(true);
    this.coursesService
      .createChannel(this.courseId(), {
        name,
        type: this.channelType(),
        description: this.channelDescription().trim() || undefined,
        isLocked: this.channelIsLocked(),
      })
      .subscribe({
        next: ({ channel }) => {
          this.creatingChannel.set(false);
          this.channels.update((list) => [...list, channel]);
          this.closeCreateChannelModal();
          this.alert.success(`Canal "${channel.name}" creado`);
        },
        error: (err) => {
          this.creatingChannel.set(false);
          this.alert.error(err.error?.message ?? 'Error al crear canal');
        },
      });
  }
}
