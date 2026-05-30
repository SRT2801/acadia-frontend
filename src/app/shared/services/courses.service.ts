import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { University } from './universities.service';

export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
  semester?: string;
  universityId: number;
  facultyId?: number;
  careerId?: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  university?: University;
  academicSpace?: AcademicSpace;
  createdBy?: User;
}

export interface AcademicSpace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  courseId: number;
  ownerId: number;
  settings: Record<string, unknown>;
  channels?: Channel[];
  categories?: ChannelCategory[];
  createdAt: string;
}

export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'TEXT' | 'ANNOUNCEMENT' | 'TASKS' | 'VOICE' | 'FORUM' | 'RESOURCES';
  position: number;
  icon?: string;
  academicSpaceId: number;
  categoryId?: number;
  isLocked: boolean;
  createdAt: string;
}

export interface ChannelCategory {
  id: number;
  name: string;
  position: number;
}

export interface CourseMember {
  id: number;
  userId: number;
  courseId: number;
  role: string;
  status: string;
  user?: User;
  joinedAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  status: string;
  emailVerifiedAt?: string;
  roleId: number;
  universityId: number;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface Invitation {
  id: number;
  code: string;
  courseId: number;
  maxUses: number;
  uses: number;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateCourseDto {
  name: string;
  code?: string;
  description?: string;
  semester?: string;
  universityId: number;
  facultyId?: number;
  careerId?: number;
}

export interface CreateCourseResponse {
  course: Course;
  invitation: Invitation;
}

export interface UpdateCourseDto {
  name?: string;
  code?: string;
  description?: string;
  semester?: string;
}

export interface UpdateSpaceDto {
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  allowStudentPosts?: boolean;
  allowFileUploads?: boolean;
  allowVoiceChannels?: boolean;
  showLeaderboard?: boolean;
}

export interface CreateChannelDto {
  name: string;
  type: 'TEXT' | 'ANNOUNCEMENT' | 'TASKS' | 'VOICE' | 'FORUM' | 'RESOURCES';
  description?: string;
  icon?: string;
  categoryId?: number;
  isLocked?: boolean;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateMemberRoleDto {
  role: 'OWNER' | 'PROFESSOR' | 'ASSISTANT' | 'STUDENT' | 'MODERATOR';
}

export interface CreateInvitationDto {
  maxUses?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface ChannelsResponse {
  channels: { items: Channel[] };
  categories: { items: ChannelCategory[] };
}

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/courses`;

  getCourses(): Observable<{ courses: Course[]; total: number }> {
    return this.http.get<{ courses: Course[]; total: number }>(this.apiUrl);
  }

  getCourse(id: number): Observable<{ course: Course }> {
    return this.http.get<{ course: Course }>(`${this.apiUrl}/${id}`);
  }

  createCourse(dto: CreateCourseDto): Observable<CreateCourseResponse> {
    return this.http.post<CreateCourseResponse>(this.apiUrl, dto);
  }

  updateCourse(id: number, dto: UpdateCourseDto): Observable<{ course: Course }> {
    return this.http.patch<{ course: Course }>(`${this.apiUrl}/${id}`, dto);
  }

  deleteCourse(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  joinCourse(code: string): Observable<{ course: Course }> {
    return this.http.get<{ course: Course }>(`${this.apiUrl}/join/${code}`);
  }

  getSpace(courseId: number): Observable<{ space: AcademicSpace }> {
    return this.http.get<{ space: AcademicSpace }>(`${this.apiUrl}/${courseId}/space`);
  }

  updateSpace(courseId: number, dto: UpdateSpaceDto): Observable<{ space: AcademicSpace }> {
    return this.http.patch<{ space: AcademicSpace }>(`${this.apiUrl}/${courseId}/space`, dto);
  }

  getChannels(courseId: number): Observable<ChannelsResponse> {
    return this.http.get<ChannelsResponse>(`${this.apiUrl}/${courseId}/channels`);
  }

  createChannel(courseId: number, dto: CreateChannelDto): Observable<{ channel: Channel }> {
    return this.http.post<{ channel: Channel }>(`${this.apiUrl}/${courseId}/channels`, dto);
  }

  updateChannel(courseId: number, chId: number, dto: Partial<CreateChannelDto>): Observable<{ channel: Channel }> {
    return this.http.patch<{ channel: Channel }>(`${this.apiUrl}/${courseId}/channels/${chId}`, dto);
  }

  deleteChannel(courseId: number, chId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${courseId}/channels/${chId}`);
  }

  reorderChannels(courseId: number, ids: number[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${courseId}/channels/reorder`, { ids });
  }

  createCategory(courseId: number, dto: CreateCategoryDto): Observable<{ category: ChannelCategory }> {
    return this.http.post<{ category: ChannelCategory }>(`${this.apiUrl}/${courseId}/categories`, dto);
  }

  updateCategory(courseId: number, catId: number, dto: CreateCategoryDto): Observable<{ category: ChannelCategory }> {
    return this.http.patch<{ category: ChannelCategory }>(`${this.apiUrl}/${courseId}/categories/${catId}`, dto);
  }

  deleteCategory(courseId: number, catId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${courseId}/categories/${catId}`);
  }

  getMembers(courseId: number): Observable<{ members: CourseMember[]; total: number }> {
    return this.http.get<{ members: CourseMember[]; total: number }>(`${this.apiUrl}/${courseId}/members`);
  }

  updateMemberRole(courseId: number, memId: number, dto: UpdateMemberRoleDto): Observable<{ member: CourseMember }> {
    return this.http.patch<{ member: CourseMember }>(`${this.apiUrl}/${courseId}/members/${memId}/role`, dto);
  }

  removeMember(courseId: number, memId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${courseId}/members/${memId}`);
  }

  createInvitation(courseId: number, dto?: CreateInvitationDto): Observable<{ invitation: Invitation }> {
    return this.http.post<{ invitation: Invitation }>(`${this.apiUrl}/${courseId}/invitations`, dto || {});
  }

  getInvitations(courseId: number): Observable<{ invitations: Invitation[]; total: number }> {
    return this.http.get<{ invitations: Invitation[]; total: number }>(`${this.apiUrl}/${courseId}/invitations`);
  }

  revokeInvitation(courseId: number, invId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${courseId}/invitations/${invId}`);
  }
}