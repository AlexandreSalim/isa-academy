import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'assessmentDraft_v1';

@Injectable({ providedIn: 'root' })
export class AssessmentDraftService {
  private draft$ = new BehaviorSubject<any | null>(null);

   private loadFromStorage(): any | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(val: any | null) {
    try {
      if (val === null) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      }
    } catch { /* ignore storage errors */ }
  }

  setDraft(d: any) {
    this.draft$.next(d);
    this.saveToStorage(d);
  }

  getDraft$() {
    return this.draft$.asObservable();
  }

  getDraftSnapshot() {
    return this.draft$.value;
  }

  clear() {
    this.draft$.next(null);
    this.saveToStorage(null);
  }
}
