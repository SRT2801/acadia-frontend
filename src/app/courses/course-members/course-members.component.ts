import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoursesService, CourseMember, Invitation } from '../../shared/services/courses.service';
import { AuthService } from '../../shared/services/auth.service';
import { AlertService } from '../../shared/services/alert.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-course-members',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './course-members.component.html',
  host: {
    class: 'flex-1 flex flex-col min-h-0',
  },
})
export class CourseMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private coursesService = inject(CoursesService);
  private auth = inject(AuthService);
  private alert = inject(AlertService);

  members = signal<CourseMember[]>([]);
  total = signal(0);
  loading = signal(true);
  courseId = signal(0);

  showInviteModal = signal(false);
  invitation = signal<Invitation | null>(null);
  copying = signal(false);

  canManageMembers = signal(false);

  roles = ['PROFESSOR', 'ASSISTANT', 'STUDENT', 'MODERATOR'] as const;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.courseId.set(id);
        this.loadMembers(id);
      }
    });

    const user = this.auth.currentUser();
    if (user && user.roleName !== 'STUDENT') {
      this.canManageMembers.set(true);
    }
  }

  private loadMembers(courseId: number) {
    this.loading.set(true);
    this.coursesService.getMembers(courseId).subscribe({
      next: ({ members, total }) => {
        this.members.set(members);
        this.total.set(total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('Error al cargar miembros');
      },
    });
  }

  getInitials(member: CourseMember): string {
    const first = member.user?.firstName?.[0] ?? '';
    const last = member.user?.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
  }

  getFullName(member: CourseMember): string {
    return `${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim();
  }

  getEmail(member: CourseMember): string {
    return member.user?.email ?? '';
  }

  getJoinedDate(member: CourseMember): string {
    if (!member.joinedAt) return '';
    const date = new Date(member.joinedAt);
    return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isOwner(member: CourseMember): boolean {
    return member.role === 'OWNER';
  }

  canChangeRole(member: CourseMember): boolean {
    return this.canManageMembers() && member.role !== 'OWNER';
  }

  onRoleChange(member: CourseMember, newRole: string) {
    const role = newRole as 'OWNER' | 'PROFESSOR' | 'ASSISTANT' | 'STUDENT' | 'MODERATOR';
    this.coursesService.updateMemberRole(this.courseId(), member.id, { role }).subscribe({
      next: ({ member: updated }) => {
        this.members.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        this.alert.success('Rol actualizado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.alert.error(err.error?.message ?? 'Error al actualizar rol');
      },
    });
  }

  onDeleteMember(member: CourseMember) {
    if (!confirm(`¿Eliminar a ${this.getFullName(member)} del curso?`)) return;
    this.coursesService.removeMember(this.courseId(), member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        this.total.update((t) => t - 1);
        this.alert.success('Miembro eliminado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.alert.error(err.error?.message ?? 'Error al eliminar miembro');
      },
    });
  }

  openInviteModal() {
    this.invitation.set(null);
    this.showInviteModal.set(true);
    this.coursesService.createInvitation(this.courseId(), {}).subscribe({
      next: ({ invitation }) => {
        this.invitation.set(invitation);
      },
      error: (err: { error?: { message?: string } }) => {
        this.showInviteModal.set(false);
        this.alert.error(err.error?.message ?? 'Error al generar invitación');
      },
    });
  }

  closeInviteModal() {
    this.showInviteModal.set(false);
    this.invitation.set(null);
  }

  copyCode() {
    const code = this.invitation()?.code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.copying.set(true);
        setTimeout(() => this.copying.set(false), 1500);
      });
    }
  }

  formatExpiry(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `${diffDays} días`;
  }
}
