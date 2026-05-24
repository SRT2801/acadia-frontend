import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface University {
  id: number;
  name: string;
  domain: string;
  logo?: string;
  city?: string;
  country?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UniversitiesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/universities`;

  findAll(): Observable<University[]> {
    return this.http.get<University[]>(this.apiUrl);
  }

  search(query: string): Observable<University[]> {
    return this.http.get<University[]>(`${this.apiUrl}/search`, {
      params: { q: query },
    });
  }

  findOne(id: number): Observable<University> {
    return this.http.get<University>(`${this.apiUrl}/${id}`);
  }
}
