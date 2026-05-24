import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, take, timeout, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RefreshStateService {
  private readonly isRefreshingSubject = new BehaviorSubject<boolean>(false);
  private readonly refreshTimedOutSubject = new BehaviorSubject<boolean>(false);

  readonly isRefreshing$ = this.isRefreshingSubject.asObservable();

  get isRefreshing(): boolean {
    return this.isRefreshingSubject.value;
  }

  startRefresh(): void {
    this.isRefreshingSubject.next(true);
    this.refreshTimedOutSubject.next(false);
  }

  completeRefresh(): void {
    this.isRefreshingSubject.next(false);
    this.refreshTimedOutSubject.next(false);
  }

  failRefresh(): void {
    this.isRefreshingSubject.next(false);
    this.refreshTimedOutSubject.next(false);
  }

  waitForRefresh(timeoutMs = 5000): Observable<boolean> {
    return this.isRefreshing$.pipe(
      filter((v) => !v),
      take(1),
      timeout(timeoutMs),
      catchError(() => {
        this.markTimedOut();
        return of(false);
      }),
    );
  }

  get timedOut$(): Observable<boolean> {
    return this.refreshTimedOutSubject.asObservable();
  }

  private markTimedOut(): void {
    this.refreshTimedOutSubject.next(true);
    this.isRefreshingSubject.next(false);
  }

  reset(): void {
    this.isRefreshingSubject.next(false);
    this.refreshTimedOutSubject.next(false);
  }
}
