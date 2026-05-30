import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  universityId?: number;
  avatar?: string;
  bio?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UserResponse {
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

export interface AuthResponse {
  user: UserResponse;
}

export interface JwtPayloadResponse {
  userId: number;
  email: string;
  roleId: number;
  universityId: number;
  sessionId: number;
  roleName: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<JwtPayloadResponse | null>(null);
  readonly userProfile = signal<UserResponse | null>(null);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly displayName = computed(() => {
    const profile = this.userProfile();
    if (profile) return `${profile.firstName} ${profile.lastName}`;
    return this.currentUser()?.email ?? '';
  });

  readonly initials = computed(() => {
    const profile = this.userProfile();
    if (profile) return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    const email = this.currentUser()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  readonly displayRole = computed(() => {
    return this.currentUser()?.roleName ?? '';
  });

  readonly userEmail = computed(() => {
    return this.currentUser()?.email ?? '';
  });

  readonly canCreateCourse = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return user.roleName !== 'STUDENT' || user.permissions.includes('course:create');
  });

  readonly canCreateChannel = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return user.roleName !== 'STUDENT' || user.permissions.includes('channel:create');
  });

  readonly theme = signal<'dark' | 'light'>(
    (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as 'dark' | 'light' ?? 'dark'
  );

  setTheme(theme: 'dark' | 'light') {
    this.theme.set(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('light', theme === 'light');
    }
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  applyTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light', this.theme() === 'light');
    }
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => this.userProfile.set(res.user)),
      tap(() => this.loadCurrentUser()),
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.userProfile.set(null);
      }),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  verifyEmail(data: VerifyEmailRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, data);
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {});
  }

  me(): Observable<JwtPayloadResponse> {
    return this.http.get<JwtPayloadResponse>(`${this.apiUrl}/me`);
  }

  loadCurrentUser(): void {
    this.me().subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.currentUser.set(null),
    });
  }
}
